import { type FormEvent, useState } from "react";
import { Form, redirect, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { Camera, ExternalLink, FileText, Folder, Layers, LogOut, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import type { Route } from "./+types/admin";
import styles from "./admin.module.css";
import { ImageToPdfPicker } from "~/components/ImageToPdfPicker/ImageToPdfPicker";
import { imagesToPdfFile, MAX_PDF_BYTES } from "~/lib/imagesToPdf";
import { clearAdminCookie, isAdminAuthenticated } from "~/utils/admin-session.server";
import { createSupabaseServiceClient } from "~/utils/supabase.server";
import { getBranch } from "~/utils/data";
import type { CmsResource, CmsSubject, ResourceCategory } from "~/types/cms";
import { RESOURCE_CATEGORIES } from "~/types/cms";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function parseStorageRef(publicUrl: string) {
  const marker = "/storage/v1/object/public/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const rest = publicUrl.slice(idx + marker.length);
  const firstSlash = rest.indexOf("/");
  if (firstSlash < 0) return null;

  return {
    bucket: rest.slice(0, firstSlash),
    path: rest.slice(firstSlash + 1),
  };
}

async function ensurePdf(file: File | null): Promise<{ file: File; bytes: ArrayBuffer }> {
  if (!file || file.size === 0) throw new Error("Please select a PDF file.");
  if (file.type && file.type !== "application/pdf") throw new Error("Only PDF files are allowed.");
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("File size must be 25 MB or less. Try fewer photos or smaller photos.");
  }

  const bytes = await file.arrayBuffer();
  const header = new TextDecoder().decode(new Uint8Array(bytes.slice(0, 5)));
  if (header !== "%PDF-") throw new Error("The uploaded file is not a valid PDF.");

  return { file, bytes };
}

function enforcePdfSize(byteLength: number) {
  if (byteLength > MAX_PDF_BYTES) {
    throw new Error("The saved PDF would be over 25 MB. Try fewer photos or smaller photos.");
  }
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getBucketForCategory(category: ResourceCategory) {
  if (category === "syllabus") return "syllabus";
  if (category.includes("premium")) return "premium";
  if (category.includes("pyq")) return "pyqs";
  return "notes";
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  syllabus: "Syllabus",
  unit_notes: "Unit notes",
  sessional_pyq: "Sessional PYQ",
  semester_pyq: "Semester PYQ",
  important_questions: "Important questions",
  playlist: "Playlist",
  premium_notes: "Premium notes",
  premium_questions: "Premium questions",
};

type SubjectGroup = {
  branch: string;
  branchName: string;
  years: {
    year: number;
    semesters: {
      semester: number;
      subjects: CmsSubject[];
    }[];
  }[];
};

function groupSubjects(subjects: CmsSubject[]): SubjectGroup[] {
  const branchMap = new Map<string, Map<number, Map<number, CmsSubject[]>>>();

  for (const subject of subjects) {
    if (!branchMap.has(subject.branch)) branchMap.set(subject.branch, new Map());
    const yearMap = branchMap.get(subject.branch)!;
    if (!yearMap.has(subject.year)) yearMap.set(subject.year, new Map());
    const semesterMap = yearMap.get(subject.year)!;
    if (!semesterMap.has(subject.semester)) semesterMap.set(subject.semester, []);
    semesterMap.get(subject.semester)!.push(subject);
  }

  return [...branchMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([branch, yearMap]) => ({
      branch,
      branchName: getBranch(branch)?.name ?? branch,
      years: [...yearMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([year, semesterMap]) => ({
          year,
          semesters: [...semesterMap.entries()]
            .sort(([a], [b]) => a - b)
            .map(([semester, semesterSubjects]) => ({
              semester,
              subjects: semesterSubjects.sort((a, b) => a.subject_name.localeCompare(b.subject_name)),
            })),
        })),
    }));
}

function groupResourcesBySubject(resources: CmsResource[]) {
  return resources.reduce<Record<string, CmsResource[]>>((acc, resource) => {
    acc[resource.subject_id] = acc[resource.subject_id] ?? [];
    acc[resource.subject_id].push(resource);
    return acc;
  }, {});
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "Size unknown";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadMode = "pdf" | "photos";
type ConversionState = { done: number; total: number; retrying: boolean };

function UploadSourceSelector({
  mode,
  setMode,
  disabled,
}: {
  mode: UploadMode;
  setMode: (mode: UploadMode) => void;
  disabled: boolean;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label="Upload source">
      <button
        type="button"
        className={mode === "pdf" ? styles.segmentActive : ""}
        onClick={() => setMode("pdf")}
        disabled={disabled}
        aria-pressed={mode === "pdf"}
      >
        <FileText size={15} />
        PDF file
      </button>
      <button
        type="button"
        className={mode === "photos" ? styles.segmentActive : ""}
        onClick={() => setMode("photos")}
        disabled={disabled}
        aria-pressed={mode === "photos"}
      >
        <Camera size={15} />
        Photos
      </button>
    </div>
  );
}

function usePhotoPdfSubmit() {
  const submit = useSubmit();
  const [mode, setMode] = useState<UploadMode>("pdf");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState("");
  const [conversion, setConversion] = useState<ConversionState | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>, titleFallback: string) => {
    if (mode === "pdf") return;

    event.preventDefault();
    setLocalError("");

    if (!photoFiles.length) {
      setLocalError("Choose at least one photo before uploading.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? titleFallback) || titleFallback;

    try {
      setConversion({ done: 0, total: photoFiles.length, retrying: false });
      const { file } = await imagesToPdfFile(photoFiles, {
        title,
        retryOnOversize: true,
        onProgress: (done, total) => setConversion((current) => ({ done, total, retrying: current?.retrying ?? false })),
        onRetry: () => setConversion({ done: 0, total: photoFiles.length, retrying: true }),
      });

      formData.set("pdf", file);
      submit(formData, { method: "post", encType: "multipart/form-data" });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Could not convert photos to PDF.");
    } finally {
      setConversion(null);
    }
  };

  const progressText = conversion
    ? `${conversion.retrying ? "Optimising smaller PDF" : "Converting photos"} (${conversion.done}/${conversion.total})`
    : "";

  return {
    mode,
    setMode,
    setPhotoFiles,
    localError,
    conversion,
    progressText,
    handleSubmit,
  };
}

function PdfSourceField({
  mode,
  setMode,
  onPhotosChange,
  disabled,
  required,
}: {
  mode: UploadMode;
  setMode: (mode: UploadMode) => void;
  onPhotosChange: (files: File[]) => void;
  disabled: boolean;
  required: boolean;
}) {
  return (
    <div className={styles.field}>
      <span>Upload PDF</span>
      <UploadSourceSelector mode={mode} setMode={setMode} disabled={disabled} />
      {mode === "pdf" ? (
        <input type="file" name="pdf" required={required} accept="application/pdf" className={styles.input} disabled={disabled} />
      ) : (
        <ImageToPdfPicker disabled={disabled} onChange={onPhotosChange} />
      )}
    </div>
  );
}

function UploadResourceForm({ subject, busy }: { subject: CmsSubject; busy: boolean }) {
  const photoSubmit = usePhotoPdfSubmit();
  const formBusy = busy || photoSubmit.conversion !== null;

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      className={styles.form}
      onSubmit={(event) => void photoSubmit.handleSubmit(event, "Resource PDF")}
    >
      <input type="hidden" name="intent" value="upload-resource" />
      <input type="hidden" name="subject_id" value={subject.id} />
      <label className={styles.field}>
        <span>Title</span>
        <input name="title" placeholder="Example: Unit 1 notes" required className={styles.input} disabled={formBusy} />
      </label>
      <div className={styles.inlineRow}>
        <label className={styles.field}>
          <span>Category</span>
          <select name="category" required className={styles.input} disabled={formBusy}>
            {RESOURCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Unit</span>
          <input name="unit_number" type="number" min={1} placeholder="Optional" className={styles.input} disabled={formBusy} />
        </label>
      </div>
      <div className={styles.inlineRow}>
        <label className={styles.field}>
          <span>Exam year</span>
          <input name="exam_year" type="number" min={2000} max={2100} placeholder="Optional" className={styles.input} disabled={formBusy} />
        </label>
        <label className={styles.field}>
          <span>Exam type</span>
          <input name="exam_type" placeholder="Optional" className={styles.input} disabled={formBusy} />
        </label>
      </div>
      <label className={styles.field}>
        <span>Description</span>
        <textarea name="description" placeholder="Optional" className={styles.input} disabled={formBusy} />
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" name="is_premium" disabled={formBusy} /> Premium resource
      </label>
      <PdfSourceField
        mode={photoSubmit.mode}
        setMode={photoSubmit.setMode}
        onPhotosChange={photoSubmit.setPhotoFiles}
        disabled={formBusy}
        required
      />
      {photoSubmit.progressText ? <p className={styles.formNote}>{photoSubmit.progressText}</p> : null}
      {photoSubmit.localError ? <p className={styles.inlineError}>{photoSubmit.localError}</p> : null}
      <button type="submit" className={styles.primaryBtn} disabled={formBusy}>
        <Upload size={15} />
        {formBusy ? photoSubmit.progressText || "Uploading..." : "Upload PDF"}
      </button>
    </Form>
  );
}

function PdfEditForm({
  intent,
  resource,
  busy,
  buttonLabel,
}: {
  intent: "replace-resource-pdf" | "append-resource-pdf";
  resource: CmsResource;
  busy: boolean;
  buttonLabel: string;
}) {
  const photoSubmit = usePhotoPdfSubmit();
  const formBusy = busy || photoSubmit.conversion !== null;

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      className={styles.fileTool}
      onSubmit={(event) => void photoSubmit.handleSubmit(event, resource.title)}
    >
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="resource_id" value={resource.id} />
      <PdfSourceField
        mode={photoSubmit.mode}
        setMode={photoSubmit.setMode}
        onPhotosChange={photoSubmit.setPhotoFiles}
        disabled={formBusy}
        required
      />
      {photoSubmit.progressText ? <p className={styles.formNote}>{photoSubmit.progressText}</p> : null}
      {photoSubmit.localError ? <p className={styles.inlineError}>{photoSubmit.localError}</p> : null}
      <button type="submit" className={styles.secondaryBtn} disabled={formBusy}>
        {formBusy ? photoSubmit.progressText || "Saving..." : buttonLabel}
      </button>
    </Form>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAdminAuthenticated(request)) {
    throw redirect("/admin/login");
  }

  const supabase = createSupabaseServiceClient();

  const [{ data: subjects, error: subjectError }, { data: resources, error: resourceError }] = await Promise.all([
    supabase.from("subjects").select("*").order("branch").order("year").order("semester").order("subject_name"),
    supabase
      .from("resources")
      .select("*, subjects(subject_name, subject_code, branch, semester)")
      .order("created_at", { ascending: false }),
  ]);

  if (subjectError) throw new Error(subjectError.message);
  if (resourceError) throw new Error(resourceError.message);

  return {
    subjects: (subjects ?? []) as CmsSubject[],
    resources: (resources ?? []) as CmsResource[],
    selectedSubjectId: new URL(request.url).searchParams.get("subjectId"),
  };
}

export async function action({ request }: Route.ActionArgs) {
  if (!isAdminAuthenticated(request)) {
    throw redirect("/admin/login");
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const supabase = createSupabaseServiceClient();

  try {
    if (intent === "logout") {
      return redirect("/admin/login", { headers: { "Set-Cookie": clearAdminCookie() } });
    }

    if (intent === "create-subject") {
      const icon = formData.get("icon");
      const payload = {
        subject_name: String(formData.get("subject_name") ?? ""),
        subject_code: String(formData.get("subject_code") ?? ""),
        branch: String(formData.get("branch") ?? ""),
        year: Number(formData.get("year") ?? 1),
        semester: Number(formData.get("semester") ?? 1),
        ...(icon === null ? {} : { icon: String(icon) || null }),
      };

      const { error } = await supabase.from("subjects").insert(payload);
      if (error) throw error;
      return { ok: true, message: "Subject added." };
    }

    if (intent === "update-subject") {
      const subjectId = String(formData.get("subject_id") ?? "");
      const icon = formData.get("icon");
      const payload = {
        subject_name: String(formData.get("subject_name") ?? ""),
        subject_code: String(formData.get("subject_code") ?? ""),
        branch: String(formData.get("branch") ?? ""),
        year: Number(formData.get("year") ?? 1),
        semester: Number(formData.get("semester") ?? 1),
        ...(icon === null ? {} : { icon: String(icon) || null }),
      };

      const { error } = await supabase.from("subjects").update(payload).eq("id", subjectId);
      if (error) throw error;
      return { ok: true, message: "Subject updated." };
    }

    if (intent === "upload-resource") {
      const category = String(formData.get("category") ?? "") as ResourceCategory;
      if (!RESOURCE_CATEGORIES.includes(category)) throw new Error("Invalid resource category.");

      const subjectId = String(formData.get("subject_id") ?? "");
      const title = String(formData.get("title") ?? "");
      const resourceUrl = String(formData.get("resource_url") ?? "").trim();
      const { data: subjectById, error: subjectByIdError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .maybeSingle();

      if (subjectByIdError) throw subjectByIdError;

      let subject = subjectById;
      if (!subject) {
        const subjectBranch = String(formData.get("subject_branch") ?? "");
        const subjectYear = Number(formData.get("subject_year") ?? 0);
        const subjectSemester = Number(formData.get("subject_semester") ?? 0);
        const subjectCode = String(formData.get("subject_code") ?? "");

        if (subjectBranch && subjectYear && subjectSemester && subjectCode) {
          const { data: subjectByKey, error: subjectByKeyError } = await supabase
            .from("subjects")
            .select("*")
            .eq("branch", subjectBranch)
            .eq("year", subjectYear)
            .eq("semester", subjectSemester)
            .eq("subject_code", subjectCode)
            .maybeSingle();

          if (subjectByKeyError) throw subjectByKeyError;
          subject = subjectByKey;
        }
      }

      if (!subject) throw new Error("Invalid subject selected.");
      const resolvedSubjectId = subject.id;

      if (resourceUrl) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(resourceUrl);
        } catch {
          throw new Error("Enter a valid resource link.");
        }
        if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
          throw new Error("Resource links must use http or https.");
        }

        const { error: insertError } = await supabase.from("resources").insert({
          subject_id: resolvedSubjectId,
          title,
          description: String(formData.get("description") ?? "") || null,
          category,
          unit_number: formData.get("unit_number") ? Number(formData.get("unit_number")) : null,
          resource_url: resourceUrl,
          resource_size: null,
          resource_type: "link",
          exam_year: formData.get("exam_year") ? Number(formData.get("exam_year")) : null,
          exam_type: String(formData.get("exam_type") ?? "") || null,
          is_premium: formData.get("is_premium") === "on",
          uploaded_by: "admin",
        });
        if (insertError) throw insertError;
        return { ok: true, message: "Resource link saved." };
      }

      const { file, bytes } = await ensurePdf(formData.get("pdf") as File | null);

      const bucket = getBucketForCategory(category);
      const fileName = `${Date.now()}-${slugify(title)}.pdf`;
      const folderPath = `${slugify(subject.branch)}/${subject.year}/${subject.semester}/${slugify(subject.subject_name)}/${category}`;
      const fullPath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(fullPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);

      const { error: insertError } = await supabase.from("resources").insert({
        subject_id: resolvedSubjectId,
        title,
        description: String(formData.get("description") ?? "") || null,
        category,
        unit_number: formData.get("unit_number") ? Number(formData.get("unit_number")) : null,
        resource_url: urlData.publicUrl,
        resource_size: file.size,
        resource_type: "pdf",
        exam_year: formData.get("exam_year") ? Number(formData.get("exam_year")) : null,
        exam_type: String(formData.get("exam_type") ?? "") || null,
        is_premium: formData.get("is_premium") === "on",
        uploaded_by: "admin",
      });
      if (insertError) throw insertError;

      return { ok: true, message: "PDF uploaded and resource saved." };
    }

    if (intent === "replace-resource-pdf" || intent === "append-resource-pdf") {
      const resourceId = String(formData.get("resource_id") ?? "");
      const { bytes: uploadedBytes } = await ensurePdf(formData.get("pdf") as File | null);
      const { data: resource, error } = await supabase
        .from("resources")
        .select("id,resource_url")
        .eq("id", resourceId)
        .single();
      if (error || !resource) throw new Error("Resource not found.");

      const storageRef = parseStorageRef(resource.resource_url);
      if (!storageRef) {
        throw new Error("This PDF is not stored in Supabase storage, so it cannot be edited in-place.");
      }

      let bytes = uploadedBytes;
      if (intent === "append-resource-pdf") {
        const { data: existingBlob, error: downloadError } = await supabase.storage
          .from(storageRef.bucket)
          .download(storageRef.path);
        if (downloadError || !existingBlob) throw new Error("Could not download existing PDF for merging.");

        const [existingPdf, addedPdf] = await Promise.all([
          PDFDocument.load(await existingBlob.arrayBuffer()),
          PDFDocument.load(bytes),
        ]);
        const copiedPages = await existingPdf.copyPages(addedPdf, addedPdf.getPageIndices());
        copiedPages.forEach((page) => existingPdf.addPage(page));
        const mergedBytes = await existingPdf.save();
        bytes = toArrayBuffer(mergedBytes);
      }

      enforcePdfSize(bytes.byteLength);

      const { error: uploadError } = await supabase.storage.from(storageRef.bucket).upload(storageRef.path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("resources")
        .update({ resource_size: bytes.byteLength })
        .eq("id", resourceId);
      if (updateError) throw updateError;

      return {
        ok: true,
        message: intent === "append-resource-pdf" ? "Pages appended to PDF." : "PDF replaced.",
      };
    }

    if (intent === "delete-resource") {
      const id = String(formData.get("resource_id") ?? "");
      const { data: resource, error } = await supabase.from("resources").select("id,resource_url").eq("id", id).single();
      if (error || !resource) throw new Error("Resource not found.");

      const storageRef = parseStorageRef(resource.resource_url);
      if (storageRef) {
        const { error: removeErr } = await supabase.storage.from(storageRef.bucket).remove([storageRef.path]);
        if (removeErr) throw removeErr;
      }

      const { error: deleteErr } = await supabase.from("resources").delete().eq("id", id);
      if (deleteErr) throw deleteErr;

      return { ok: true, message: "Resource deleted." };
    }

    if (intent === "update-resource") {
      const resourceId = String(formData.get("resource_id") ?? "");
      const category = String(formData.get("category") ?? "") as ResourceCategory;
      if (!RESOURCE_CATEGORIES.includes(category)) throw new Error("Invalid category.");

      const patch = {
        title: String(formData.get("title") ?? ""),
        category,
        unit_number: formData.get("unit_number") ? Number(formData.get("unit_number")) : null,
        exam_year: formData.get("exam_year") ? Number(formData.get("exam_year")) : null,
        exam_type: String(formData.get("exam_type") ?? "") || null,
        description: String(formData.get("description") ?? "") || null,
        is_premium: formData.get("is_premium") === "on",
      };

      const { error: updateErr } = await supabase.from("resources").update(patch).eq("id", resourceId);
      if (updateErr) throw updateErr;

      return { ok: true, message: "Resource metadata updated." };
    }

    return { ok: false, message: "Unknown action." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Action failed",
    };
  }
}

export default function AdminRoute() {
  const { subjects, resources, selectedSubjectId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";
  const subjectGroups = groupSubjects(subjects);
  const resourcesBySubject = groupResourcesBySubject(resources);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Content manager</p>
          <h1 className={styles.title}>Admin Library</h1>
          <p className={styles.subtitle}>Browse the same structure students see, then edit subjects and PDFs in place.</p>
        </div>
        <Form method="post" className={styles.logoutForm}>
          <input type="hidden" name="intent" value="logout" />
          <button className={styles.logoutBtn} type="submit">
            <LogOut size={16} />
            Logout
          </button>
        </Form>
      </header>

      {actionData ? (
        <p className={[styles.message, actionData.ok ? styles.messageOk : styles.messageError].join(" ")}>{actionData.message}</p>
      ) : null}

      <div className={styles.workspace}>
        <main className={styles.explorer} aria-label="Library content">
          <div className={styles.toolbar}>
            <div>
              <h2 className={styles.panelTitle}>Library Explorer</h2>
              <p className={styles.panelHint}>{subjects.length} subjects - {resources.length} resources</p>
            </div>
          </div>

          {!subjects.length ? <p className={styles.empty}>No subjects found yet. Add the first subject from the right panel.</p> : null}

          <div className={styles.folderList}>
            {subjectGroups.map((branchGroup) => (
              <details className={styles.branchFolder} key={branchGroup.branch} open>
                <summary className={styles.branchSummary}>
                  <Folder size={18} />
                  <span>{branchGroup.branchName}</span>
                  <small>{branchGroup.branch}</small>
                </summary>

                <div className={styles.yearList}>
                  {branchGroup.years.map((yearGroup) => (
                    <details className={styles.yearFolder} key={`${branchGroup.branch}-${yearGroup.year}`} open>
                      <summary className={styles.yearSummary}>
                        <Layers size={16} />
                        <span>Year {yearGroup.year}</span>
                      </summary>

                      {yearGroup.semesters.map((semesterGroup) => (
                        <section className={styles.semesterBlock} key={`${branchGroup.branch}-${yearGroup.year}-${semesterGroup.semester}`}>
                          <div className={styles.semesterHeader}>
                            <h3>Semester {semesterGroup.semester}</h3>
                            <span>{semesterGroup.subjects.length} subjects</span>
                          </div>

                          <div className={styles.subjectList}>
                            {semesterGroup.subjects.map((subject) => {
                              const subjectResources = resourcesBySubject[subject.id] ?? [];

                              return (
                                <article className={styles.subjectItem} key={subject.id}>
                                  <div className={styles.subjectTop}>
                                    <div className={styles.subjectIdentity}>
                                      <div className={styles.subjectIcon}>{subject.icon || subject.subject_code.slice(0, 2)}</div>
                                      <div>
                                        <h4>{subject.subject_name}</h4>
                                        <p>{subject.subject_code} - {subjectResources.length} resources</p>
                                      </div>
                                    </div>
                                    <details className={styles.editBox} open={subject.id === selectedSubjectId}>
                                      <summary className={styles.editSummary}>
                                        <Pencil size={15} />
                                        Edit subject
                                      </summary>
                                      <Form method="post" className={styles.form}>
                                        <input type="hidden" name="intent" value="update-subject" />
                                        <input type="hidden" name="subject_id" value={subject.id} />
                                        <div className={styles.inlineRow}>
                                          <label className={styles.field}>
                                            <span>Subject name</span>
                                            <input name="subject_name" defaultValue={subject.subject_name} className={styles.input} required />
                                          </label>
                                          <label className={styles.field}>
                                            <span>Code</span>
                                            <input name="subject_code" defaultValue={subject.subject_code} className={styles.input} required />
                                          </label>
                                        </div>
                                        <div className={styles.inlineRow}>
                                          <label className={styles.field}>
                                            <span>Branch</span>
                                            <input name="branch" defaultValue={subject.branch} className={styles.input} required />
                                          </label>
                                          <label className={styles.field}>
                                            <span>Icon</span>
                                            <input name="icon" defaultValue={subject.icon ?? ""} placeholder="Optional" className={styles.input} />
                                          </label>
                                        </div>
                                        <div className={styles.inlineRow}>
                                          <label className={styles.field}>
                                            <span>Year</span>
                                            <input name="year" type="number" min={1} max={4} defaultValue={subject.year} required className={styles.input} />
                                          </label>
                                          <label className={styles.field}>
                                            <span>Semester</span>
                                            <input name="semester" type="number" min={1} max={8} defaultValue={subject.semester} required className={styles.input} />
                                          </label>
                                        </div>
                                        <button type="submit" className={styles.primaryBtn} disabled={busy}>
                                          <Save size={15} />
                                          Save subject
                                        </button>
                                      </Form>
                                    </details>
                                  </div>

                                  <details className={styles.uploadBox}>
                                    <summary className={styles.uploadSummary}>
                                      <Upload size={15} />
                                      Upload PDF to this subject
                                    </summary>
                                    <UploadResourceForm subject={subject} busy={busy} />
                                  </details>

                                  <div className={styles.resourceList}>
                                    {subjectResources.length ? (
                                      subjectResources.map((resource) => (
                                        <details key={resource.id} className={styles.resourceItem}>
                                          <summary className={styles.resourceSummary}>
                                            <FileText size={16} />
                                            <span>{resource.title}</span>
                                            <small>{CATEGORY_LABELS[resource.category as ResourceCategory] ?? resource.category}</small>
                                          </summary>

                                          <div className={styles.resourceBody}>
                                            <div className={styles.resourceMeta}>
                                              <span>{formatBytes(resource.resource_size)}</span>
                                              {resource.unit_number ? <span>Unit {resource.unit_number}</span> : null}
                                              {resource.exam_year ? <span>{resource.exam_year}</span> : null}
                                              {resource.is_premium ? <span>Premium</span> : null}
                                              <a href={resource.resource_url} target="_blank" rel="noreferrer">
                                                <ExternalLink size={14} />
                                                Open PDF
                                              </a>
                                            </div>

                                            <Form method="post" className={styles.form}>
                                              <input type="hidden" name="intent" value="update-resource" />
                                              <input type="hidden" name="resource_id" value={resource.id} />
                                              <div className={styles.inlineRow}>
                                                <label className={styles.field}>
                                                  <span>Title</span>
                                                  <input name="title" defaultValue={resource.title} className={styles.input} required />
                                                </label>
                                                <label className={styles.field}>
                                                  <span>Category</span>
                                                  <select name="category" defaultValue={resource.category} className={styles.input}>
                                                    {RESOURCE_CATEGORIES.map((category) => (
                                                      <option key={category} value={category}>
                                                        {CATEGORY_LABELS[category]}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </label>
                                              </div>
                                              <div className={styles.inlineRow}>
                                                <label className={styles.field}>
                                                  <span>Unit</span>
                                                  <input name="unit_number" type="number" min={1} defaultValue={resource.unit_number ?? ""} className={styles.input} />
                                                </label>
                                                <label className={styles.field}>
                                                  <span>Exam year</span>
                                                  <input name="exam_year" type="number" min={2000} max={2100} defaultValue={resource.exam_year ?? ""} className={styles.input} />
                                                </label>
                                              </div>
                                              <label className={styles.field}>
                                                <span>Exam type</span>
                                                <input name="exam_type" defaultValue={resource.exam_type ?? ""} className={styles.input} />
                                              </label>
                                              <label className={styles.field}>
                                                <span>Description</span>
                                                <textarea name="description" defaultValue={resource.description ?? ""} className={styles.input} />
                                              </label>
                                              <label className={styles.checkboxLabel}>
                                                <input type="checkbox" name="is_premium" defaultChecked={resource.is_premium} /> Premium resource
                                              </label>
                                              <button type="submit" className={styles.primaryBtn} disabled={busy}>
                                                <Save size={15} />
                                                Save resource
                                              </button>
                                            </Form>

                                            <div className={styles.fileTools}>
                                              <PdfEditForm intent="replace-resource-pdf" resource={resource} busy={busy} buttonLabel="Replace PDF" />

                                              <PdfEditForm intent="append-resource-pdf" resource={resource} busy={busy} buttonLabel="Add pages" />

                                              <Form method="post">
                                                <input type="hidden" name="intent" value="delete-resource" />
                                                <input type="hidden" name="resource_id" value={resource.id} />
                                                <button type="submit" className={styles.deleteBtn} disabled={busy}>
                                                  <Trash2 size={15} />
                                                  Delete
                                                </button>
                                              </Form>
                                            </div>
                                          </div>
                                        </details>
                                      ))
                                    ) : (
                                      <p className={styles.emptyInline}>No PDFs uploaded for this subject yet.</p>
                                    )}
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </main>

        <aside className={styles.sidePanel}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <Plus size={18} />
              <h2 className={styles.panelTitle}>Add Subject</h2>
            </div>
            <Form method="post" className={styles.form}>
              <input type="hidden" name="intent" value="create-subject" />
              <label className={styles.field}>
                <span>Subject name</span>
                <input name="subject_name" placeholder="Database Management System" required className={styles.input} />
              </label>
              <label className={styles.field}>
                <span>Subject code</span>
                <input name="subject_code" placeholder="BCS-501" required className={styles.input} />
              </label>
              <label className={styles.field}>
                <span>Branch</span>
                <input name="branch" placeholder="cse-ai" required className={styles.input} />
              </label>
              <div className={styles.inlineRow}>
                <label className={styles.field}>
                  <span>Year</span>
                  <input name="year" type="number" min={1} max={4} placeholder="3" required className={styles.input} />
                </label>
                <label className={styles.field}>
                  <span>Semester</span>
                  <input name="semester" type="number" min={1} max={8} placeholder="5" required className={styles.input} />
                </label>
              </div>
              <label className={styles.field}>
                <span>Icon</span>
                <input name="icon" placeholder="Optional" className={styles.input} />
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={busy}>
                <Plus size={15} />
                Add subject
              </button>
            </Form>
          </section>
        </aside>
      </div>
    </div>
  );
}
