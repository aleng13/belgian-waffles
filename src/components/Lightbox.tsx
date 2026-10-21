import { useCallback, useEffect, useRef, useState } from "react";
import type { Memory } from "../config/content";
import MemoryPhoto from "./MemoryPhoto";
import "./Lightbox.css";

type Props = {
  memories: Memory[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
};

function formatDate(iso?: string): string {
  if (!iso) return "add a date ♡";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "add a date ♡";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export default function Lightbox({ memories, index, onClose, onNavigate, onEdit, onDelete }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const touchX = useRef<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const memory = memories[index];
  const count = memories.length;

  const go = useCallback(
    (delta: number) => {
      setMenuOpen(false);
      onNavigate((index + delta + count) % count);
    },
    [index, count, onNavigate],
  );

  // Lock background scroll, move focus into the dialog, and give focus back on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { body, documentElement } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement;
        if (e.shiftKey && current === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        } else if (!dialogRef.current.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!memory) return null;

  return (
    <div
      className="lightbox"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Photo ${index + 1} of ${count}: ${memory.caption}`}
        ref={dialogRef}
      >
        <button ref={closeRef} type="button" className="lb-close" onClick={onClose} aria-label="Close photo viewer">
          <span aria-hidden="true">close ✕</span>
        </button>
        {memory.id.includes("/") && onEdit && onDelete && (
          <div className="lb-photo-actions">
            <button
              type="button"
              className="lb-options-toggle"
              aria-label={`Photo options for ${memory.caption}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">•••</span>
            </button>
            {menuOpen && (
              <div className="lb-options-menu">
                <button type="button" onClick={() => onEdit(memory)}>Edit</button>
                <button type="button" onClick={() => onDelete(memory)}>Delete</button>
              </div>
            )}
          </div>
        )}

        <figure
          className="lb-card"
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null) return;
            if (Math.abs(end - start) > 50) go(end < start ? 1 : -1);
          }}
        >
          <div className="lb-photo" key={memory.id}>
            <MemoryPhoto memory={memory} large />
          </div>
          <figcaption className="lb-caption">
            <span className="lb-title">{memory.caption}</span>
            {memory.note && <span className="lb-note">{memory.note}</span>}
            <time className="lb-date" dateTime={memory.date}>
              {formatDate(memory.date)}
            </time>
          </figcaption>
        </figure>

        <div className="lb-nav">
          <button type="button" className="lb-arrow" onClick={() => go(-1)} aria-label="Previous photo">
            <span aria-hidden="true">←</span>
          </button>
          <span className="lb-count" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button type="button" className="lb-arrow" onClick={() => go(1)} aria-label="Next photo">
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
