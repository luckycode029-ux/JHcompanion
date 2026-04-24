import { ChevronDown } from "lucide-react";
import type { Unit } from "~/types";
import { ResourceButton } from "~/components/resource-button/resource-button";
import styles from "./unit-card.module.css";
import { useState } from "react";

interface UnitCardProps {
  unit: Unit;
  onOpenPdf?: (title: string, driveUrl: string) => void;
}

export function UnitCard({ unit, onOpenPdf }: UnitCardProps) {
  const [open, setOpen] = useState(false);
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
          <ResourceButton
            label="Handwritten Notes"
            icon="notes"
            variant="notes"
            href={unit.unitNotes ?? unit.notes}
            onClick={
              (unit.unitNotes ?? unit.notes).trim()
                ? () => openUnitPdf(`Unit ${unit.number} Handwritten Notes`, unit.unitNotes ?? unit.notes)
                : undefined
            }
            disabled={!(unit.unitNotes ?? unit.notes).trim()}
          />
          <ResourceButton
            label="Important PYQs"
            icon="pyqs"
            variant="pyqs"
            href={unit.pyqs}
            onClick={unit.pyqs.trim() ? () => openUnitPdf(`Unit ${unit.number} PYQs`, unit.pyqs) : undefined}
            disabled={!unit.pyqs.trim()}
          />
        </div>
      )}
    </div>
  );
}
