import { PDFDocument } from "pdf-lib";

export const MAX_PDF_BYTES = 25 * 1024 * 1024;

export type ImagesToPdfOptions = {
  maxSide?: number;
  quality?: number;
  onProgress?: (done: number, total: number) => void;
};

export type ImagesToPdfFileOptions = ImagesToPdfOptions & {
  title: string;
  retryOnOversize?: boolean;
  onRetry?: () => void;
};

type ProcessedImage = {
  bytes: ArrayBuffer;
  width: number;
  height: number;
};

function safeFileName(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "photo-notes"}.pdf`;
}

async function canvasToJpeg(canvas: HTMLCanvasElement, quality: number, fileName: string) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error(`Could not convert ${fileName} to JPEG.`);
  return blob.arrayBuffer();
}

function getScaledSize(width: number, height: number, maxSide: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= maxSide) return { width, height };

  const scale = maxSide / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function processImage(file: File, maxSide: number, quality: number): Promise<ProcessedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name || "Selected file"} is not a supported image.`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`Could not read ${file.name || "one of the selected images"}. Try a JPG, PNG, WebP, or HEIC exported as JPG.`);
  }

  try {
    const size = getScaledSize(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the image canvas.");

    context.drawImage(bitmap, 0, 0, size.width, size.height);

    return {
      bytes: await canvasToJpeg(canvas, quality, file.name || "selected image"),
      width: size.width,
      height: size.height,
    };
  } finally {
    bitmap.close();
  }
}

export async function imagesToPdf(files: File[], opts: ImagesToPdfOptions = {}): Promise<Blob> {
  if (!files.length) throw new Error("Choose at least one photo to convert.");

  const maxSide = opts.maxSide ?? 1800;
  const quality = opts.quality ?? 0.8;
  const pdf = await PDFDocument.create();

  for (let index = 0; index < files.length; index += 1) {
    const processed = await processImage(files[index], maxSide, quality);
    const jpg = await pdf.embedJpg(processed.bytes);
    const page = pdf.addPage([processed.width, processed.height]);
    page.drawImage(jpg, {
      x: 0,
      y: 0,
      width: processed.width,
      height: processed.height,
    });
    opts.onProgress?.(index + 1, files.length);
  }

  const bytes = await pdf.save();
  return new Blob([toArrayBuffer(bytes)], { type: "application/pdf" });
}

export async function imagesToPdfFile(files: File[], opts: ImagesToPdfFileOptions): Promise<{ file: File; didRetry: boolean }> {
  const makeFile = (blob: Blob) => new File([blob], safeFileName(opts.title), { type: "application/pdf" });
  const first = await imagesToPdf(files, opts);

  if (!opts.retryOnOversize || first.size <= MAX_PDF_BYTES) {
    return { file: makeFile(first), didRetry: false };
  }

  opts.onRetry?.();
  const compact = await imagesToPdf(files, {
    ...opts,
    maxSide: 1400,
    quality: 0.6,
  });

  if (compact.size > MAX_PDF_BYTES) {
    throw new Error("The converted PDF is still over 25 MB. Try fewer photos, crop blank margins, or take smaller photos.");
  }

  return { file: makeFile(compact), didRetry: true };
}
