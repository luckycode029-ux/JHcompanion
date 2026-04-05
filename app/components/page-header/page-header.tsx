import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import styles from "./page-header.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  accentColor?: string;
}

export function PageHeader({ title, subtitle, backTo, backLabel, accentColor }: PageHeaderProps) {
  return (
    <div className={styles.header} style={{ "--accent": accentColor } as React.CSSProperties}>
      {backTo && (
        <Link to={backTo} className={styles.back}>
          <ChevronLeft size={18} />
          <span>{backLabel ?? "Back"}</span>
        </Link>
      )}
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
