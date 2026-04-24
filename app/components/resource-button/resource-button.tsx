import { Play, FileText, HelpCircle, Download } from "lucide-react";
import styles from "./resource-button.module.css";

type Variant = "youtube" | "notes" | "pyqs" | "download" | "default";

interface ResourceButtonProps {
  href?: string;
  label: string;
  icon: "youtube" | "notes" | "pyqs" | "download";
  variant?: Variant;
  onClick?: () => void;
  disabled?: boolean;
}

const ICONS = {
  youtube: Play,
  notes: FileText,
  pyqs: HelpCircle,
  download: Download,
};

export function ResourceButton({ href, label, icon, variant = "default", onClick, disabled = false }: ResourceButtonProps) {
  const Icon = ICONS[icon] ?? FileText;
  const className = [styles.btn, styles[variant]].join(" ");
  const isDisabled = disabled || (!onClick && !href?.trim());

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} disabled={isDisabled}>
        <Icon size={15} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-disabled={isDisabled}>
      <Icon size={15} />
      <span>{label}</span>
    </a>
  );
}
