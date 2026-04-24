import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, Download, ExternalLink, RefreshCw } from "lucide-react";
import { Skeleton } from "~/components/skeleton/skeleton";
import { useLazyIframe } from "~/hooks/useLazyIframe";
import { convertDriveLink } from "~/utils/convertDriveLink";
import styles from "./PDFViewer.module.css";

const LazyPdfViewerFrame = lazy(() => import("./pdf-viewer-frame"));

interface PdfBookmark {
  id: string;
  title: string;
  sourceUrl: string;
  savedAt: string;
}

const BOOKMARK_KEY = "hbtech_pdf_bookmarks_v1";

export interface PDFViewerProps {
  title: string;
  driveUrl?: string | null;
}

function readBookmarks(): PdfBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(BOOKMARK_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PDFViewer({ title, driveUrl }: PDFViewerProps) {
  const sanitizedUrl = (driveUrl ?? "").trim();
  const { fileId, previewUrl, downloadUrl } = useMemo(() => convertDriveLink(sanitizedUrl), [sanitizedUrl]);
  const openInNewTabUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : previewUrl;
  const bookmarkId = fileId ?? previewUrl;

  const { ref, isInView } = useLazyIframe();

  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(sanitizedUrl));
  const [hasError, setHasError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setIsLoading(Boolean(sanitizedUrl));
    setHasError(false);
    setIframeKey(0);
  }, [sanitizedUrl]);

  useEffect(() => {
    const bookmarks = readBookmarks();
    setIsBookmarked(bookmarks.some((bookmark) => bookmark.id === bookmarkId));
  }, [bookmarkId]);

  useEffect(() => {
    if (!showToast) return;
    const timer = window.setTimeout(() => setShowToast(false), 2200);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  const toggleBookmark = () => {
    const bookmarks = readBookmarks();
    const existing = bookmarks.find((bookmark) => bookmark.id === bookmarkId);
    if (existing) {
      const next = bookmarks.filter((bookmark) => bookmark.id !== bookmarkId);
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      setIsBookmarked(false);
      return;
    }

    const next: PdfBookmark[] = [
      ...bookmarks,
      { id: bookmarkId, title, sourceUrl: sanitizedUrl, savedAt: new Date().toISOString() },
    ];
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    setIsBookmarked(true);
  };

  const retryLoad = () => {
    setHasError(false);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    setShowToast(true);
  };

  if (!sanitizedUrl) {
    return (
      <div className={styles.viewerCard}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.message}>PDF link is not available yet.</div>
      </div>
    );
  }

  return (
    <section className={styles.viewerCard}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.actions}>
          <button type="button" onClick={toggleBookmark} className={styles.actionBtn}>
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
          </button>
          <a className={styles.actionBtn} href={openInNewTabUrl} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={16} />
            <span>Open</span>
          </a>
          <a className={styles.actionBtn} href={downloadUrl} target="_blank" rel="noreferrer noopener">
            <Download size={16} />
            <span>Download</span>
          </a>
        </div>
      </header>

      <div
        ref={ref}
        className={styles.iframeWrap}
        onContextMenu={(event) => event.preventDefault()}
        role="presentation"
      >
        {!isInView ? (
          <div className={styles.placeholder}>
            <p>Scroll to load PDF viewer</p>
          </div>
        ) : hasError ? (
          <div className={styles.error}>
            <p>Unable to load PDF</p>
            <button type="button" onClick={retryLoad} className={styles.retryBtn}>
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className={styles.loadingState}>
                <Skeleton className={styles.headerSkeleton} />
                <Skeleton className={styles.viewerSkeleton} />
              </div>
            )}
            <Suspense
              fallback={
                <div className={styles.loadingState}>
                  <Skeleton className={styles.headerSkeleton} />
                  <Skeleton className={styles.viewerSkeleton} />
                </div>
              }
            >
              <div className={styles.frameHolder}>
                <LazyPdfViewerFrame
                  key={iframeKey}
                  src={previewUrl}
                  title={title}
                  onLoad={handleLoad}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                />
                {isLoading && (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.loadingState}>
                      <Skeleton className={styles.headerSkeleton} />
                      <Skeleton className={styles.viewerSkeleton} />
                    </div>
                  </div>
                )}
              </div>
            </Suspense>
          </>
        )}
      </div>

      {showToast && <div className={styles.toast}>PDF opened successfully</div>}
    </section>
  );
}
