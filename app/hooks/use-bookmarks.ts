import { useState, useEffect, useCallback } from "react";
import { getBookmarks, toggleBookmark as toggle } from "~/utils/bookmarks";
import type { Subject } from "~/types";
import { getAllSubjects } from "~/utils/data";

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  useEffect(() => {
    setBookmarkedIds(getBookmarks());
  }, []);

  const toggleBookmark = useCallback((subjectId: string) => {
    toggle(subjectId);
    setBookmarkedIds(getBookmarks());
  }, []);

  const checkIsBookmarked = useCallback(
    (subjectId: string) => bookmarkedIds.includes(subjectId),
    [bookmarkedIds]
  );

  const bookmarkedSubjects: Subject[] = getAllSubjects().filter((s) =>
    bookmarkedIds.includes(s.id)
  );

  return { bookmarkedIds, toggleBookmark, isBookmarked: checkIsBookmarked, bookmarkedSubjects };
}
