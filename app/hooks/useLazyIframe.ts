import { useEffect, useRef, useState } from "react";

interface UseLazyIframeOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export function useLazyIframe(options: UseLazyIframeOptions = {}) {
  const { rootMargin = "200px", threshold = 0.1, once = true } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        setIsInView(true);
        if (once) observer.disconnect();
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, isInView };
}
