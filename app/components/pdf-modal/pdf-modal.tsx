import { X } from "lucide-react";
import type { MouseEvent } from "react";
import { PDFViewer } from "~/components/PDFViewer";
import styles from "./pdf-modal.module.css";

interface PdfModalProps {
  title: string;
  driveUrl?: string | null;
  onClose: () => void;
}

export function PdfModal({ title, driveUrl, onClose }: PdfModalProps) {
  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.panel} onContextMenu={(event) => event.preventDefault()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close PDF viewer">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          <PDFViewer title={title} driveUrl={driveUrl} />
        </div>
      </div>
    </div>
  );
}
