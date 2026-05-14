import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import type { Route } from "./+types/admin";
import styles from "./admin.module.css";
import { clearAdminCookie, isAdminAuthenticated } from "~/utils/admin-session.server";
import { createSupabaseServiceClient } from "~/utils/supabase.server";
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

function ensurePdf(file: File | null): File {
  if (!file || file.size === 0) throw new Error("Please select a PDF file.");
  if (file.type !== "application/pdf") throw new Error("Only PDF files are allowed.");
  if (file.size > 25 * 1024 * 1024) throw new Error("File size must be 25MB or less.");
  return file;
}

function getBucketForCategory(category: ResourceCategory) {
  if (category === "syllabus") return "syllabus";
  if (category.includes("premium")) return "premium";
  if (category.includes("pyq")) return "pyqs";
  return "notes";
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!isAdminAuthenticated(request)) {
    throw redirect("/admin/login");
  }

  const supabase = createSupabaseServiceClient();

  const [{ data: subjects, error: subjectError }, { data: resources, error: resourceError }] = await Promise.all([
    supabase.from("subjects").select("*").order("subject_name"),
    supabase
      .from("resources")
      .select("*, subjects(subject_name, subject_code, branch, semester)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (subjectError) throw new Error(subjectError.message);
  if (resourceError) throw new Error(resourceError.message);

  return {
    subjects: (subjects ?? []) as CmsSubject[],
    resources: (resources ?? []) as CmsResource[],
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
      const payload = {
        subject_name: String(formData.get("subject_name") ?? ""),
        subject_code: String(formData.get("subject_code") ?? ""),
        branch: String(formData.get("branch") ?? ""),
        year: Number(formData.get("year") ?? 1),
        semester: Number(formData.get("semester") ?? 1),
        icon: String(formData.get("icon") ?? "") || null,
      };

      const { error } = await supabase.from("subjects").insert(payload);
      if (error) throw error;
      return { ok: true, message: "Subject added." };
    }

    if (intent === "upload-resource") {
      const category = String(formData.get("category") ?? "") as ResourceCategory;
      if (!RESOURCE_CATEGORIES.includes(category)) throw new Error("Invalid resource category.");

      const subjectId = String(formData.get("subject_id") ?? "");
      const title = String(formData.get("title") ?? "");
      const file = ensurePdf(formData.get("pdf") as File | null);

      const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();
      if (subjectError || !subject) throw new Error("Invalid subject selected.");

      const bucket = getBucketForCategory(category);
      const fileName = `${Date.now()}-${slugify(title)}.pdf`;
      const folderPath = `${slugify(subject.branch)}/${subject.year}/${subject.semester}/${slugify(subject.subject_name)}/${category}`;
      const fullPath = `${folderPath}/${fileName}`;

      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fullPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);

      const { error: insertError } = await supabase.from("resources").insert({
        subject_id: subjectId,
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
  const { subjects, resources } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Portal</h1>
        <Form method="post">
          <input type="hidden" name="intent" value="logout" />
          <button className={styles.logoutBtn} type="submit">
            Logout
          </button>
        </Form>
      </header>

      {actionData ? (
        <p className={[styles.message, actionData.ok ? styles.messageOk : styles.messageError].join(" ")}>{actionData.message}</p>
      ) : null}

      <section className={styles.grid}>
        <div className={styles.card}>
          <h2>Upload Resource PDF</h2>
          <Form method="post" encType="multipart/form-data" className={styles.form}>
            <input type="hidden" name="intent" value="upload-resource" />
            <input name="title" placeholder="Title" required className={styles.input} />
            <select name="subject_id" required className={styles.input}>
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option value={subject.id} key={subject.id}>
                  {subject.subject_name} ({subject.subject_code})
                </option>
              ))}
            </select>
            <select name="category" required className={styles.input}>
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className={styles.inlineRow}>
              <input name="unit_number" type="number" min={1} placeholder="Unit" className={styles.input} />
              <input name="exam_year" type="number" min={2000} max={2100} placeholder="Exam Year" className={styles.input} />
            </div>
            <input name="exam_type" placeholder="Exam Type (optional)" className={styles.input} />
            <textarea name="description" placeholder="Description (optional)" className={styles.input} />
            <label className={styles.checkboxLabel}>
              <input type="checkbox" name="is_premium" /> Mark as premium
            </label>
            <input type="file" name="pdf" required accept="application/pdf" className={styles.input} />
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              {busy ? "Uploading..." : "Upload PDF"}
            </button>
          </Form>
        </div>

        <div className={styles.card}>
          <h2>Add Subject</h2>
          <Form method="post" className={styles.form}>
            <input type="hidden" name="intent" value="create-subject" />
            <input name="subject_name" placeholder="Subject Name" required className={styles.input} />
            <input name="subject_code" placeholder="Subject Code" required className={styles.input} />
            <input name="branch" placeholder="Branch (e.g., cse-ai)" required className={styles.input} />
            <div className={styles.inlineRow}>
              <input name="year" type="number" min={1} max={4} placeholder="Year" required className={styles.input} />
              <input name="semester" type="number" min={1} max={8} placeholder="Semester" required className={styles.input} />
            </div>
            <input name="icon" placeholder="Icon (optional)" className={styles.input} />
            <button type="submit" className={styles.primaryBtn} disabled={busy}>
              Add Subject
            </button>
          </Form>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Manage Resources</h2>
        {!resources.length ? <p className={styles.empty}>No resources found yet.</p> : null}
        <div className={styles.resourceList}>
          {resources.map((resource) => (
            <div key={resource.id} className={styles.resourceItem}>
              <Form method="post" className={styles.form}>
                <input type="hidden" name="intent" value="update-resource" />
                <input type="hidden" name="resource_id" value={resource.id} />
                <div className={styles.inlineRow}>
                  <input name="title" defaultValue={resource.title} className={styles.input} required />
                  <select name="category" defaultValue={resource.category} className={styles.input}>
                    {RESOURCE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.inlineRow}>
                  <input name="unit_number" type="number" min={1} defaultValue={resource.unit_number ?? ""} className={styles.input} />
                  <input name="exam_year" type="number" min={2000} max={2100} defaultValue={resource.exam_year ?? ""} className={styles.input} />
                </div>
                <input name="exam_type" defaultValue={resource.exam_type ?? ""} className={styles.input} />
                <textarea name="description" defaultValue={resource.description ?? ""} className={styles.input} />
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="is_premium" defaultChecked={resource.is_premium} /> Premium
                </label>
                <p className={styles.metaLine}>
                  {(resource.subjects as { subject_name?: string } | null)?.subject_name ?? "Unknown Subject"} | {new Date(resource.created_at).toLocaleString()}
                </p>
                <div className={styles.inlineRow}>
                  <button type="submit" className={styles.secondaryBtn} disabled={busy}>
                    Save
                  </button>
                </div>
              </Form>

              <Form method="post">
                <input type="hidden" name="intent" value="delete-resource" />
                <input type="hidden" name="resource_id" value={resource.id} />
                <button type="submit" className={styles.deleteBtn} disabled={busy}>
                  Delete
                </button>
              </Form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
