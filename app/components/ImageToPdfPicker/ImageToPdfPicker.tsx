import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import { type ChangeEvent, type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ImageToPdfPicker.module.css";

type ImagePage = {
  id: string;
  file: File;
  url: string;
};

type ImageToPdfPickerProps = {
  disabled?: boolean;
  onChange: (files: File[]) => void;
};

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateOutputSize(files: File[]) {
  if (!files.length) return 0;
  return Math.max(100 * 1024, Math.round(files.reduce((total, file) => total + file.size, 0) * 0.55));
}

function moveItem(items: ImagePage[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function ImageToPdfPicker({ disabled = false, onChange }: ImageToPdfPickerProps) {
  const [pages, setPages] = useState<ImagePage[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef(new Set<string>());
  const files = useMemo(() => pages.map((page) => page.file), [pages]);
  const estimatedSize = estimateOutputSize(files);

  useEffect(() => {
    onChange(files);
  }, [files, onChange]);

  useEffect(() => {
    return () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current.clear();
    };
  }, []);

  const addFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return;

    const nextPages = Array.from(selectedFiles).map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id: createId(), file, url };
    });

    setPages((current) => [...current, ...nextPages]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  };

  const removePage = (id: string) => {
    setPages((current) => {
      const page = current.find((item) => item.id === id);
      if (page) {
        URL.revokeObjectURL(page.url);
        objectUrls.current.delete(page.url);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const movePage = (id: string, direction: -1 | 1) => {
    setPages((current) => {
      const fromIndex = current.findIndex((page) => page.id === id);
      return moveItem(current, fromIndex, fromIndex + direction);
    });
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, id: string) => {
    if (disabled) return;
    setDraggedId(id);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    if (!disabled && draggedId) event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    if (disabled || !draggedId || draggedId === targetId) return;

    setPages((current) => {
      const fromIndex = current.findIndex((page) => page.id === draggedId);
      const toIndex = current.findIndex((page) => page.id === targetId);
      return moveItem(current, fromIndex, toIndex);
    });
    setDraggedId(null);
  };

  const openFileDialog = () => inputRef.current?.click();

  return (
    <div className={styles.picker}>
      <div className={styles.summary}>
        <span>{pages.length} photos</span>
        <span>Estimated PDF {estimatedSize ? formatBytes(estimatedSize) : "0 KB"}</span>
      </div>

      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        disabled={disabled}
        onChange={handleFileChange}
        aria-label="Choose photos for PDF"
      />

      {pages.length ? (
        <div className={styles.grid}>
          {pages.map((page, index) => (
            <article
              key={page.id}
              className={[styles.pageTile, draggedId === page.id ? styles.dragging : ""].join(" ")}
              draggable={!disabled}
              onDragStart={(event) => handleDragStart(event, page.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={handleDragOver}
              onDrop={(event) => handleDrop(event, page.id)}
            >
              <div className={styles.thumbWrap}>
                <img className={styles.thumb} src={page.url} alt={`Selected page ${index + 1}`} />
                <span className={styles.pageNumber}>Page {index + 1}</span>
              </div>
              <div className={styles.pageMeta}>
                <GripVertical size={16} aria-hidden="true" />
                <span title={page.file.name}>{page.file.name || `Photo ${index + 1}`}</span>
              </div>
              <div className={styles.pageActions}>
                <button
                  type="button"
                  onClick={() => movePage(page.id, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move page ${index + 1} earlier`}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => movePage(page.id, 1)}
                  disabled={disabled || index === pages.length - 1}
                  aria-label={`Move page ${index + 1} later`}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removePage(page.id)}
                  disabled={disabled}
                  aria-label={`Remove page ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <button type="button" className={styles.emptyButton} onClick={openFileDialog} disabled={disabled}>
          <ImagePlus size={18} />
          Choose photos
        </button>
      )}

      {pages.length ? (
        <button type="button" className={styles.addButton} onClick={openFileDialog} disabled={disabled}>
          <ImagePlus size={16} />
          Add more photos
        </button>
      ) : null}
    </div>
  );
}
