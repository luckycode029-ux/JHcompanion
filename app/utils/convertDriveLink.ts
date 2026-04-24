const DRIVE_ID_REGEXES = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /\/uc\?.*?[?&]id=([a-zA-Z0-9_-]+)/,
  /\/document\/d\/([a-zA-Z0-9_-]+)/,
];

function extractFileId(rawUrl: string): string | null {
  for (const regex of DRIVE_ID_REGEXES) {
    const match = rawUrl.match(regex);
    if (match?.[1]) return match[1];
  }
  return null;
}

export interface ConvertedDriveLink {
  fileId: string | null;
  previewUrl: string;
  downloadUrl: string;
}

export function convertDriveLink(rawUrl: string): ConvertedDriveLink {
  const trimmed = rawUrl.trim();
  const fileId = extractFileId(trimmed);

  if (!fileId) {
    return {
      fileId: null,
      previewUrl: trimmed,
      downloadUrl: trimmed,
    };
  }

  return {
    fileId,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}
