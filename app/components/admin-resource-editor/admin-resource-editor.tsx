import { useFetcher } from "react-router";
import { Link2, Save, Upload, X } from "lucide-react";
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
  const isSaving = fetcher.state !== "idle";
  const feedback = fetcher.data as { ok?: boolean; message?: string } | undefined;
  const isPlaylist = category === "playlist";

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

        <fetcher.Form method="post" action="/admin/manage" encType="multipart/form-data" className={styles.form}>
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
            <label className={styles.field}>
              <span>Upload a new PDF</span>
              <div className={styles.fileInput}><Upload size={16} /><input name="pdf" type="file" accept="application/pdf" /></div>
            </label>
          ) : null}

          <p className={styles.help}>{isPlaylist ? "Paste the new playlist link." : "Paste a link or choose a PDF. The newest file becomes the one students see."}</p>
          {feedback?.message ? <p className={feedback.ok ? styles.success : styles.error}>{feedback.message}</p> : null}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              <Save size={16} />{isSaving ? "Saving..." : "Save resource"}
            </button>
          </div>
        </fetcher.Form>
      </section>
    </div>
  );
}
