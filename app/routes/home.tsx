import { getBranches } from "~/utils/data";
import { BranchCard } from "~/components/branch-card/branch-card";
import { SearchBar } from "~/components/search-bar/search-bar";
import { useSearch } from "~/hooks/use-search";
import { SubjectCard } from "~/components/subject-card/subject-card";
import { useBookmarks } from "~/hooks/use-bookmarks";
import { BookOpen, GraduationCap } from "lucide-react";
import styles from "./home.module.css";

export function meta() {
  return [{ title: "Hamdard BTech Companion" }];
}

export default function Home() {
  const branches = getBranches();
  const { query, setQuery, results, hasQuery } = useSearch();
  const { isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroIcon}>
          <GraduationCap size={32} />
        </div>
        <h1 className={styles.heroTitle}>Hamdard BTech Companion</h1>
        <p className={styles.heroSub}>Your one-stop resource hub for Jamia Hamdard University</p>
        <div className={styles.searchWrap}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search any subject or course code..." />
        </div>
      </div>

      {hasQuery ? (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <BookOpen size={18} />
            <h2 className={styles.sectionTitle}>Search Results</h2>
            <span className={styles.sectionCount}>{results.length} found</span>
          </div>
          {results.length === 0 ? (
            <div className={styles.empty}>No subjects matched your search.</div>
          ) : (
            <div className={styles.subjectsGrid}>
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
          )}
        </div>
      ) : (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Select Your Branch</h2>
          </div>
          <div className={styles.branchGrid}>
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
