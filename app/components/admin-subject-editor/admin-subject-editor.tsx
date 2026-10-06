import { useFetcher } from "react-router";
import { Save, X } from "lucide-react";
import type { Subject } from "~/types";
import styles from "./admin-subject-editor.module.css";

interface AdminSubjectEditorProps {
  subject: Subject;
  onClose: () => void;
}

export function AdminSubjectEditor({ subject, onClose }: AdminSubjectEditorProps) {
  const fetcher = useFetcher();
  const isSaving = fetcher.state !== "idle";
  const feedback = fetcher.data as { ok?: boolean; message?: string } | undefined;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="edit-subject-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Admin edit</p>
            <h2 id="edit-subject-title" className={styles.title}>Edit {subject.name}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close editor">
            <X size={18} />
          </button>
        </header>

        <fetcher.Form method="post" action="/admin/manage" className={styles.form}>
          <input type="hidden" name="intent" value="update-subject" />
          <input type="hidden" name="subject_id" value={subject.id} />
          <label className={styles.field}>
            <span>Subject name</span>
            <input name="subject_name" defaultValue={subject.name} required />
          </label>
          <label className={styles.field}>
            <span>Subject code</span>
            <input name="subject_code" defaultValue={subject.code} required />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Year</span>
              <input name="year" type="number" min={1} max={4} defaultValue={subject.year} required />
            </label>
            <label className={styles.field}>
              <span>Semester</span>
              <input name="semester" type="number" min={1} max={8} defaultValue={subject.semester} required />
            </label>
          </div>
          <label className={styles.field}>
            <span>Branch</span>
            <input name="branch" defaultValue={subject.branch} required />
          </label>

          {feedback?.message ? <p className={feedback.ok ? styles.success : styles.error}>{feedback.message}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </fetcher.Form>
      </section>
    </div>
  );
}
