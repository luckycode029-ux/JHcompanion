import { useParams, Link } from "react-router";
import { getBranch, getSubjectsByBranchAndYear } from "~/utils/data";
import { SubjectCard } from "~/components/subject-card/subject-card";
import { PageHeader } from "~/components/page-header/page-header";
import { useBookmarks } from "~/hooks/use-bookmarks";
import styles from "./year.module.css";

const YEAR_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

export function meta({ params }: { params: Record<string, string> }) {
  const branch = getBranch(params.branch ?? "");
  return [{ title: `Year ${params.year} | ${branch?.name ?? ""} - Hamdard BTech` }];
}

export default function YearPage() {
  const { branch: branchId, year: yearStr } = useParams();
  const branch = getBranch(branchId ?? "");
  const year = parseInt(yearStr ?? "1", 10);
  const subjects = getSubjectsByBranchAndYear(branchId ?? "", year);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const subjectsBySemester = subjects.reduce<Record<number, typeof subjects>>((acc, subject) => {
    if (!acc[subject.semester]) {
      acc[subject.semester] = [];
    }
    acc[subject.semester].push(subject);
    return acc;
  }, {});
  const semesters = Object.keys(subjectsBySemester)
    .map(Number)
    .sort((a, b) => a - b);

  if (!branch) {
    return (
      <div className={styles.error}>
        <p>Branch not found.</p>
        <Link to="/" className={styles.back}>Go Home</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={YEAR_LABELS[year] ?? `Year ${year}`}
        subtitle={`${branch.name} - ${branch.fullName}`}
        backTo={`/branch/${branchId}`}
        backLabel={branch.name}
        accentColor={branch.color}
      />
      <div className={styles.content}>
        {subjects.length === 0 ? (
          <div className={styles.empty}>
            <p>No subjects available yet for this year.</p>
          </div>
        ) : (
          <div className={styles.sections}>
            {semesters.map((semester) => (
              <section key={semester} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Semester {semester}</h2>
                  <div className={styles.sectionMeta}>{subjectsBySemester[semester].length} subjects</div>
                </div>
                <div className={styles.grid}>
                  {subjectsBySemester[semester].map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      isBookmarked={isBookmarked(subject.id)}
                      onBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
