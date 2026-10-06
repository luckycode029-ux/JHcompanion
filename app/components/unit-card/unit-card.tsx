import { ChevronDown, Pencil } from "lucide-react";
import type { Unit } from "~/types";
import type { ResourceCategory } from "~/types/cms";
import { ResourceButton } from "~/components/resource-button/resource-button";
import styles from "./unit-card.module.css";
import { useState } from "react";

interface UnitCardProps {
  unit: Unit;
  onOpenPdf?: (title: string, driveUrl: string) => void;
  onEditResource?: (category: ResourceCategory, title: string, unitNumber: number) => void;
}

export function UnitCard({ unit, onOpenPdf, onEditResource }: UnitCardProps) {
  const [open, setOpen] = useState(false);
  const noteUrl = unit.notesDriveUrl ?? unit.unitNotes ?? unit.notes;

  const openUnitPdf = (title: string, driveUrl: string) => {
    if (!driveUrl.trim()) return;
    onOpenPdf?.(title, driveUrl);
  };

  return (
    <div className={styles.card}>
      <button className={styles.header} onClick={() => setOpen((o) => !o)}>
        <div className={styles.unitNum}>Unit {unit.number}</div>
        <div className={styles.title}>{unit.title}</div>
        <ChevronDown size={18} className={[styles.chevron, open ? styles.chevronOpen : ""].join(" ")} />
      </button>
      {open && (
        <div className={styles.resources}>
          <ResourceButton href={unit.playlist} icon="youtube" label="Watch Playlist" variant="youtube" />
          {onEditResource ? <button type="button" className={styles.editBtn} onClick={() => onEditResource("playlist", `Unit ${unit.number} Playlist`, unit.number)} aria-label={`Edit Unit ${unit.number} playlist`} title="Edit playlist"><Pencil size={14} /></button> : null}
          <ResourceButton
            label="Handwritten Notes"
            icon="notes"
            variant="notes"
            href={noteUrl}
            onClick={
              noteUrl.trim()
                ? () => openUnitPdf(`Unit ${unit.number} Handwritten Notes`, noteUrl)
                : undefined
            }
            disabled={!noteUrl.trim()}
          />
          {onEditResource ? <button type="button" className={styles.editBtn} onClick={() => onEditResource("unit_notes", `Unit ${unit.number} Handwritten Notes`, unit.number)} aria-label={`Edit Unit ${unit.number} notes`} title="Edit notes"><Pencil size={14} /></button> : null}
          <ResourceButton
            label="Important PYQs"
            icon="pyqs"
            variant="pyqs"
            href={unit.pyqs}
            onClick={unit.pyqs.trim() ? () => openUnitPdf(`Unit ${unit.number} PYQs`, unit.pyqs) : undefined}
            disabled={!unit.pyqs.trim()}
          />
          {onEditResource ? <button type="button" className={styles.editBtn} onClick={() => onEditResource("important_questions", `Unit ${unit.number} Important PYQs`, unit.number)} aria-label={`Edit Unit ${unit.number} PYQs`} title="Edit PYQs"><Pencil size={14} /></button> : null}
        </div>
      )}
    </div>
  );
}
