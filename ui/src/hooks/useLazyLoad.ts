import { useEffect, useState, useCallback, useRef } from "react";

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseLazyLoadReturn {
  isVisible: boolean;
  hasLoaded: boolean;
  setRef: (element: HTMLElement | null) => void;
}

export function useLazyLoad({
  threshold = 0.1,
  rootMargin = "100px",
  enabled = true,
}: UseLazyLoadOptions = {}): UseLazyLoadReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const setRef = useCallback(
    (element: HTMLElement | null) => {
      if (elementRef.current && observerRef.current) {
        observerRef.current.disconnect();
        elementRef.current = null;
      }

      elementRef.current = element;

      if (enabled && element) {
        observerRef.current = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              setHasLoaded(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          },
          { threshold, rootMargin }
        );
        observerRef.current.observe(element);
      }
    },
    [enabled, threshold, rootMargin]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    isVisible,
    hasLoaded,
    setRef,
  };
}
