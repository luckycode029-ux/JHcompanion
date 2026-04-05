import { useState } from "react";
import { useParams, Link } from "react-router";
import { getSubject, getBranch } from "~/utils/data";
import { UnitCard } from "~/components/unit-card/unit-card";
import { ResourceButton } from "~/components/resource-button/resource-button";
import { PageHeader } from "~/components/page-header/page-header";
import { SyllabusModal } from "~/components/syllabus-modal/syllabus-modal";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { Bookmark, BookmarkCheck, BookOpen, FileQuestion, ScrollText } from "lucide-react";
import styles from "./subject.module.css";

export function meta({ params }: { params: Record<string, string> }) {
  const subject = getSubject(params.subjectId ?? "");
  return [{ title: subject ? `${subject.name} - Hamdard BTech` : "Subject" }];
}

export default function SubjectPage() {
  const { subjectId } = useParams();
  const subject = getSubject(subjectId ?? "");
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [syllabusOpen, setSyllabusOpen] = useState(false);

  if (!subject) {
    return (
      <div className={styles.error}>
        <p>Subject not found.</p>
        <Link to="/" className={styles.back}>Go Home</Link>
      </div>
    );
  }

  const branch = getBranch(subject.branch);
  const bookmarked = isBookmarked(subject.id);

  return (
    <div className={styles.page}>
      <PageHeader
        title={subject.name}
        subtitle={`${subject.code} • Semester ${subject.semester} • ${branch?.name ?? ""}`}
        backTo={`/branch/${subject.branch}/year/${subject.year}`}
        backLabel={`Year ${subject.year}`}
        accentColor={branch?.color}
      />

      <div className={styles.quickActions}>
        <button
          className={styles.syllabusBtn}
          onClick={() => setSyllabusOpen(true)}
        >
          <ScrollText size={16} />
          <span>View Syllabus</span>
        </button>
        {subject.syllabus && (
          <ResourceButton href={subject.syllabus} icon="download" label="Download PDF" variant="download" />
        )}
        <button
          className={[styles.bookmarkBtn, bookmarked ? styles.bookmarkActive : ""].join(" ")}
          onClick={() => toggleBookmark(subject.id)}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          <span>{bookmarked ? "Bookmarked" : "Bookmark"}</span>
        </button>
      </div>
      {syllabusOpen && (
        <SyllabusModal subject={subject} onClose={() => setSyllabusOpen(false)} />
      )}

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <BookOpen size={18} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Unit-wise Resources</h2>
          </div>
          <div className={styles.unitsList}>
            {subject.units.map((unit) => (
              <UnitCard key={unit.number} unit={unit} />
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
              <ResourceButton href={subject.pyqs.sessional} icon="download" label="View PYQs" variant="download" />
            </div>
            <div className={styles.pyqCard}>
              <div className={styles.pyqLabel}>End Semester PYQs</div>
              <p className={styles.pyqDesc}>Final examination papers</p>
              <ResourceButton href={subject.pyqs.semester} icon="download" label="View PYQs" variant="download" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
