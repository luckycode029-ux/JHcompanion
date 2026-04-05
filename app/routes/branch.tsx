import { useParams, Link } from "react-router";
import { getBranch, getSubjectsByBranchAndYear } from "~/utils/data";
import { YearCard } from "~/components/year-card/year-card";
import { PageHeader } from "~/components/page-header/page-header";
import { Cpu, Brain, Radio } from "lucide-react";
import styles from "./branch.module.css";

const YEARS = [1, 2, 3, 4];

export function meta({ params }: { params: Record<string, string> }) {
  const branch = getBranch(params.branch ?? "");
  return [{ title: branch ? `${branch.name} - Hamdard BTech` : "Branch" }];
}

export default function BranchPage() {
  const { branch: branchId } = useParams();
  const branch = getBranch(branchId ?? "");

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
        title={branch.name}
        subtitle={branch.fullName}
        backTo="/"
        backLabel="Home"
        accentColor={branch.color}
      />
      <div className={styles.content}>
        <p className={styles.lead}>Select your year to browse subjects:</p>
        <div className={styles.grid}>
          {YEARS.map((year) => {
            const count = getSubjectsByBranchAndYear(branch.id, year).length;
            return (
              <YearCard key={year} year={year} branch={branch.id} subjectCount={count} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
