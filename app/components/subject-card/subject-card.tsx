import { Link } from "react-router";
import { Bookmark, BookmarkCheck, BookOpen } from "lucide-react";
import type { Subject } from "~/types";
import { getBranch } from "~/utils/data";
import styles from "./subject-card.module.css";

interface SubjectCardProps {
  subject: Subject;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
  showBranch?: boolean;
}

export function SubjectCard({ subject, isBookmarked = false, onBookmark, showBranch = false }: SubjectCardProps) {
  const branch = showBranch ? getBranch(subject.branch) : undefined;

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    onBookmark?.(subject.id);
  };

  return (
    <Link to={`/subject/${subject.id}`} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <BookOpen size={18} />
        </div>
        <button className={styles.bookmarkBtn} onClick={handleBookmark} aria-label="Toggle bookmark">
          {isBookmarked ? <BookmarkCheck size={18} className={styles.bookmarked} /> : <Bookmark size={18} />}
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.code}>{subject.code}</div>
        {branch && <div className={styles.branch}>{branch.name}</div>}
        <div className={styles.name}>{subject.name}</div>
      </div>
      <div className={styles.footer}>
        <span className={styles.badge}>Sem {subject.semester}</span>
        <span className={styles.units}>{subject.units.length} units</span>
      </div>
    </Link>
  );
}
