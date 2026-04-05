import { Play, FileText, HelpCircle, Download } from "lucide-react";
import styles from "./resource-button.module.css";

type Variant = "youtube" | "notes" | "pyqs" | "download" | "default";

interface ResourceButtonProps {
  href: string;
  label: string;
  icon: "youtube" | "notes" | "pyqs" | "download";
  variant?: Variant;
}

const ICONS = {
  youtube: Play,
  notes: FileText,
  pyqs: HelpCircle,
  download: Download,
};

export function ResourceButton({ href, label, icon, variant = "default" }: ResourceButtonProps) {
  const Icon = ICONS[icon] ?? FileText;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[styles.btn, styles[variant]].join(" ")}
    >
      <Icon size={15} />
      <span>{label}</span>
    </a>
  );
}
