import { useState, useMemo } from "react";
import { searchSubjects } from "~/utils/data";
import type { Subject } from "~/types";

export function useSearch() {
  const [query, setQuery] = useState("");

  const results: Subject[] = useMemo(() => {
    if (!query.trim()) return [];
    return searchSubjects(query);
  }, [query]);

  return { query, setQuery, results, hasQuery: query.trim().length > 0 };
}
