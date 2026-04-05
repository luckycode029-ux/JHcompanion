import { Link } from "react-router";
import { Cpu, Brain, Radio } from "lucide-react";
import type { Branch } from "~/types";
import styles from "./branch-card.module.css";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  cpu: Cpu,
  brain: Brain,
  radio: Radio,
};

interface BranchCardProps {
  branch: Branch;
}

export function BranchCard({ branch }: BranchCardProps) {
  const Icon = ICONS[branch.icon] ?? Cpu;

  return (
    <Link to={`/branch/${branch.id}`} className={styles.card} style={{ "--branch-color": branch.color } as React.CSSProperties}>
      <div className={styles.iconWrap}>
        <Icon size={28} />
      </div>
      <div className={styles.content}>
        <div className={styles.name}>{branch.name}</div>
        <div className={styles.fullName}>{branch.fullName}</div>
      </div>
      <div className={styles.arrow}>→</div>
    </Link>
  );
}
