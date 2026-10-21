import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Tracks an element's rendered width (px) with a ResizeObserver. */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1000 : Math.max(280, Math.min(window.innerWidth - 32, 1120)),
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.round(el.getBoundingClientRect().width));
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}
