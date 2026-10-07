import { type FormEvent, useEffect, useState } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { Camera, FileText, Link2, Save, Upload, X } from "lucide-react";
import { ImageToPdfPicker } from "~/components/ImageToPdfPicker/ImageToPdfPicker";
import { imagesToPdfFile } from "~/lib/imagesToPdf";
import type { ResourceCategory } from "~/types/cms";
import type { Subject } from "~/types";
import styles from "./admin-resource-editor.module.css";

interface AdminResourceEditorProps {
  subject: Subject;
  category: ResourceCategory;
  title: string;
  unitNumber?: number;
  onClose: () => void;
}

export function AdminResourceEditor({ subject, category, title, unitNumber, onClose }: AdminResourceEditorProps) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [uploadMode, setUploadMode] = useState<"pdf" | "photos">("pdf");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState("");
  const [conversion, setConversion] = useState<{ done: number; total: number; retrying: boolean } | null>(null);
  const isSaving = fetcher.state !== "idle" || conversion !== null;
  const feedback = fetcher.data as { ok?: boolean; message?: string } | undefined;
  const isPlaylist = category === "playlist";

  useEffect(() => {
    if (feedback?.ok) revalidator.revalidate();
  }, [feedback?.ok, revalidator]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (isPlaylist || uploadMode === "pdf") return;

    event.preventDefault();
    setLocalError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const resourceUrl = String(formData.get("resource_url") ?? "").trim();
    if (resourceUrl) {
      fetcher.submit(formData, {
        method: "post",
        action: "/admin/manage",
        encType: "multipart/form-data",
      });
      return;
    }

    if (!photoFiles.length) {
      setLocalError("Choose at least one photo before saving.");
      return;
    }

    const resourceTitle = String(formData.get("title") ?? title);

    try {
      setConversion({ done: 0, total: photoFiles.length, retrying: false });
      const { file } = await imagesToPdfFile(photoFiles, {
        title: resourceTitle,
        retryOnOversize: true,
        onProgress: (done, total) => setConversion((current) => ({ done, total, retrying: current?.retrying ?? false })),
        onRetry: () => setConversion({ done: 0, total: photoFiles.length, retrying: true }),
      });

      formData.set("pdf", file);
      fetcher.submit(formData, {
        method: "post",
        action: "/admin/manage",
        encType: "multipart/form-data",
      });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Could not convert photos to PDF.");
    } finally {
      setConversion(null);
    }
  };

  const progressText = conversion
    ? `${conversion.retrying ? "Optimising smaller PDF" : "Converting photos"} (${conversion.done}/${conversion.total})`
    : null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="resource-editor-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admin resource editor</p>
            <h2 id="resource-editor-title" className={styles.title}>{title}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close editor"><X size={18} /></button>
        </header>

        <fetcher.Form method="post" action="/admin/manage" encType="multipart/form-data" className={styles.form} onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value="upload-resource" />
          <input type="hidden" name="subject_id" value={subject.id} />
          <input type="hidden" name="category" value={category} />
          {unitNumber ? <input type="hidden" name="unit_number" value={unitNumber} /> : null}

          <label className={styles.field}>
            <span>Resource title</span>
            <input name="title" defaultValue={title} required />
          </label>

          <label className={styles.field}>
            <span>{isPlaylist ? "YouTube or playlist link" : "Resource or Drive link"}</span>
            <div className={styles.inputWithIcon}><Link2 size={16} /><input name="resource_url" type="url" placeholder="https://..." /></div>
          </label>

          {!isPlaylist ? (
            <div className={styles.field}>
              <span>Upload PDF</span>
              <div className={styles.segmented} role="radiogroup" aria-label="Upload source">
                <button
                  type="button"
                  className={uploadMode === "pdf" ? styles.segmentActive : ""}
                  onClick={() => setUploadMode("pdf")}
                  disabled={isSaving}
                  aria-pressed={uploadMode === "pdf"}
                >
                  <FileText size={15} />
                  PDF file
                </button>
                <button
                  type="button"
                  className={uploadMode === "photos" ? styles.segmentActive : ""}
                  onClick={() => setUploadMode("photos")}
                  disabled={isSaving}
                  aria-pressed={uploadMode === "photos"}
                >
                  <Camera size={15} />
                  Photos
                </button>
              </div>
              {uploadMode === "pdf" ? (
                <div className={styles.fileInput}><Upload size={16} /><input name="pdf" type="file" accept="application/pdf" disabled={isSaving} /></div>
              ) : (
                <ImageToPdfPicker disabled={isSaving} onChange={setPhotoFiles} />
              )}
            </div>
          ) : null}

          <p className={styles.help}>{isPlaylist ? "Paste the new playlist link." : "Paste a link or choose a PDF. The newest file becomes the one students see."}</p>
          {progressText ? <p className={styles.help}>{progressText}</p> : null}
          {localError ? <p className={styles.error}>{localError}</p> : null}
          {feedback?.message ? <p className={feedback.ok ? styles.success : styles.error}>{feedback.message}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              <Save size={16} />{isSaving ? progressText ?? "Saving..." : "Save resource"}
            </button>
          </div>
        </fetcher.Form>
      </section>
    </div>
  );
}
