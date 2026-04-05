import { Link } from "react-router";
import { CalendarDays } from "lucide-react";
import styles from "./year-card.module.css";

interface YearCardProps {
  year: number;
  branch: string;
  subjectCount: number;
}

const YEAR_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

const YEAR_SEMESTERS: Record<number, string> = {
  1: "Sem 1 & 2",
  2: "Sem 3 & 4",
  3: "Sem 5 & 6",
  4: "Sem 7 & 8",
};

export function YearCard({ year, branch, subjectCount }: YearCardProps) {
  return (
    <Link to={`/branch/${branch}/year/${year}`} className={styles.card}>
      <div className={styles.yearNum}>{year}</div>
      <div className={styles.content}>
        <div className={styles.label}>{YEAR_LABELS[year]}</div>
        <div className={styles.meta}>{YEAR_SEMESTERS[year]}</div>
        <div className={styles.count}>{subjectCount} subjects</div>
      </div>
      <CalendarDays size={20} className={styles.icon} />
    </Link>
  );
}
