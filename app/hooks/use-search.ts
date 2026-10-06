import { useState, useMemo } from "react";
import type { Subject } from "~/types";

export function useSearch(subjects: Subject[]) {
  const [query, setQuery] = useState("");

  const results: Subject[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return subjects.filter((subject) => subject.name.toLowerCase().includes(q) || subject.code.toLowerCase().includes(q));
  }, [query, subjects]);

  return { query, setQuery, results, hasQuery: query.trim().length > 0 };
}
