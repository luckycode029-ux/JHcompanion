interface PdfViewerFrameProps {
  src: string;
  title: string;
  onLoad: () => void;
  onError: () => void;
}

export default function PdfViewerFrame({ src, title, onLoad, onError }: PdfViewerFrameProps) {
  return (
    <iframe
      src={src}
      title={title}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-presentation allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      allow="fullscreen"
      onLoad={onLoad}
      onError={onError}
      style={{
        border: "none",
        width: "100%",
        minHeight: "500px",
        height: "clamp(500px, 74vh, 980px)",
        display: "block",
      }}
    />
  );
}
