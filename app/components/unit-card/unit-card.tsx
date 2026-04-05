import { ChevronDown } from "lucide-react";
import type { Unit } from "~/types";
import { ResourceButton } from "~/components/resource-button/resource-button";
import styles from "./unit-card.module.css";
import { useState } from "react";

interface UnitCardProps {
  unit: Unit;
}

export function UnitCard({ unit }: UnitCardProps) {
  const [open, setOpen] = useState(false);

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
          <ResourceButton href={unit.notes} icon="notes" label="Handwritten Notes" variant="notes" />
          <ResourceButton href={unit.pyqs} icon="pyqs" label="Important PYQs" variant="pyqs" />
        </div>
      )}
    </div>
  );
}
