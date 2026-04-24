import { useState } from "react";
import { Link, useParams } from "react-router";
import { Bookmark, BookmarkCheck, BookOpen, FileQuestion, ScrollText } from "lucide-react";
import { PdfModal } from "~/components/pdf-modal/pdf-modal";
import { PageHeader } from "~/components/page-header/page-header";
import { ResourceButton } from "~/components/resource-button/resource-button";
import { UnitCard } from "~/components/unit-card/unit-card";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { getBranch, getSubject } from "~/utils/data";
import styles from "./subject.module.css";

interface OpenPdfState {
  title: string;
  driveUrl: string;
}

export function meta({ params }: { params: Record<string, string> }) {
  const subject = getSubject(params.subjectId ?? "");
  return [{ title: subject ? `${subject.name} - Hamdard BTech` : "Subject" }];
}

export default function SubjectPage() {
  const { subjectId } = useParams();
  const subject = getSubject(subjectId ?? "");
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [activePdf, setActivePdf] = useState<OpenPdfState | null>(null);

  if (!subject) {
    return (
      <div className={styles.error}>
        <p>Subject not found.</p>
        <Link to="/" className={styles.back}>
          Go Home
        </Link>
      </div>
    );
  }

  const branch = getBranch(subject.branch);
  const bookmarked = isBookmarked(subject.id);
  const syllabusPdf = subject.syllabusPdf ?? subject.syllabus;
  const sessionalPyqs = subject.sessionalPyqs ?? subject.pyqs.sessional;
  const semesterPyqs = subject.semesterPyqs ?? subject.pyqs.semester;

  const openPdf = (title: string, driveUrl?: string | null) => {
    const url = (driveUrl ?? "").trim();
    if (!url) return;
    setActivePdf({ title, driveUrl: url });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title={subject.name}
        subtitle={`${subject.code} - Semester ${subject.semester} - ${branch?.name ?? ""}`}
        backTo={`/branch/${subject.branch}/year/${subject.year}`}
        backLabel={`Year ${subject.year}`}
        accentColor={branch?.color}
      />

      <div className={styles.quickActions}>
        <button
          className={styles.syllabusBtn}
          onClick={() => openPdf(`${subject.name} Syllabus`, syllabusPdf)}
          disabled={!syllabusPdf.trim()}
        >
          <ScrollText size={16} />
          <span>View Syllabus</span>
        </button>
        <button
          className={[styles.bookmarkBtn, bookmarked ? styles.bookmarkActive : ""].join(" ")}
          onClick={() => toggleBookmark(subject.id)}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          <span>{bookmarked ? "Bookmarked" : "Bookmark"}</span>
        </button>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <BookOpen size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Unit-wise Resources</h2>
          </div>
          <div className={styles.unitsList}>
            {subject.units.map((unit) => (
              <UnitCard
                key={unit.number}
                unit={unit}
                onOpenPdf={(title, driveUrl) => openPdf(title, driveUrl)}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FileQuestion size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Previous Year Questions</h2>
          </div>
          <div className={styles.pyqGrid}>
            <div className={styles.pyqCard}>
              <div className={styles.pyqLabel}>Sessional PYQs</div>
              <p className={styles.pyqDesc}>Mid-semester examination papers</p>
              <ResourceButton
                label="View PYQs"
                icon="download"
                variant="download"
                onClick={() => openPdf(`${subject.name} Sessional PYQs`, sessionalPyqs)}
                disabled={!sessionalPyqs.trim()}
              />
            </div>
            <div className={styles.pyqCard}>
              <div className={styles.pyqLabel}>End Semester PYQs</div>
              <p className={styles.pyqDesc}>Final examination papers</p>
              <ResourceButton
                label="View PYQs"
                icon="download"
                variant="download"
                onClick={() => openPdf(`${subject.name} Semester PYQs`, semesterPyqs)}
                disabled={!semesterPyqs.trim()}
              />
            </div>
          </div>
        </section>
      </div>

      {activePdf && <PdfModal title={activePdf.title} driveUrl={activePdf.driveUrl} onClose={() => setActivePdf(null)} />}
    </div>
  );
}
