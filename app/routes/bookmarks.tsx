import { useBookmarks } from "~/hooks/use-bookmarks";
import { SubjectCard } from "~/components/subject-card/subject-card";
import { PageHeader } from "~/components/page-header/page-header";
import { Bookmark } from "lucide-react";
import styles from "./bookmarks.module.css";

export function meta() {
  return [{ title: "Bookmarks - Hamdard BTech Companion" }];
}

export default function BookmarksPage() {
  const { bookmarkedSubjects, isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Bookmarks"
        subtitle="Your saved subjects for quick access"
      />
      <div className={styles.content}>
        {bookmarkedSubjects.length === 0 ? (
          <div className={styles.empty}>
            <Bookmark size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No bookmarks yet</p>
            <p className={styles.emptyDesc}>Browse subjects and tap the bookmark icon to save them here.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {bookmarkedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                isBookmarked={isBookmarked(subject.id)}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
