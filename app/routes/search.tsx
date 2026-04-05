import { useSearch } from "~/hooks/use-search";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { SearchBar } from "~/components/search-bar/search-bar";
import { SubjectCard } from "~/components/subject-card/subject-card";
import { PageHeader } from "~/components/page-header/page-header";
import styles from "./search.module.css";

export function meta() {
  return [{ title: "Search - Hamdard BTech Companion" }];
}

export default function SearchPage() {
  const { query, setQuery, results, hasQuery } = useSearch();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <div className={styles.page}>
      <PageHeader title="Search" subtitle="Find subjects by name or course code" />
      <div className={styles.content}>
        <SearchBar value={query} onChange={setQuery} placeholder="e.g. Data Structures, CS201..." />
        {hasQuery && (
          <div className={styles.results}>
            {results.length === 0 ? (
              <div className={styles.empty}>No subjects found for &ldquo;{query}&rdquo;</div>
            ) : (
              <>
                <p className={styles.count}>{results.length} result{results.length !== 1 ? "s" : ""} found</p>
                <div className={styles.grid}>
                  {results.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      isBookmarked={isBookmarked(subject.id)}
                      onBookmark={toggleBookmark}
                      showBranch
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {!hasQuery && (
          <div className={styles.hint}>Start typing to search through all subjects across all branches.</div>
        )}
      </div>
    </div>
  );
}
