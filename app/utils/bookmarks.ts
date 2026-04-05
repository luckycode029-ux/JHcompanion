const BOOKMARK_KEY = "hamdard_bookmarks";

export function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(subjectId: string): boolean {
  const bookmarks = getBookmarks();
  const idx = bookmarks.indexOf(subjectId);
  if (idx === -1) {
    bookmarks.push(subjectId);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return true;
  } else {
    bookmarks.splice(idx, 1);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return false;
  }
}
