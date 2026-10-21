import { useId } from "react";
import type { Memory } from "../config/content";

/** Six soft watercolour palettes for the drawn placeholder pictures. */
const TONES = [
  { sky: ["#f8e3d6", "#f2c6c4"], far: "#c99ba0", near: "#858c70", sun: "#f5d98a" },
  { sky: ["#efe6f1", "#d9c9e0"], far: "#b7a3bd", near: "#8f9877", sun: "#f8e3a6" },
  { sky: ["#f6ecd2", "#f1d6a6"], far: "#d2a572", near: "#858c70", sun: "#fff1c4" },
  { sky: ["#e4ebe0", "#cbd8c4"], far: "#9aa584", near: "#6f7a52", sun: "#f5d98a" },
  { sky: ["#f9e0dc", "#efbdbb"], far: "#b9787e", near: "#9a8a6c", sun: "#fbe7b0" },
  { sky: ["#e9e2ef", "#f0d3d9"], far: "#c4a3b4", near: "#858c70", sun: "#f5d98a" },
];

type Props = { memory: Memory; large?: boolean };

/**
 * Shows the real photo if `memory.src` is set. Otherwise draws a clearly-labelled
 * placeholder – it never pretends to be an actual memory.
 */
export default function MemoryPhoto({ memory, large = false }: Props) {
  const gid = useId().replace(/:/g, "");
  if (memory.src) {
    return (
      <img
        className="memory-img"
        src={memory.src}
        alt={memory.alt ?? memory.caption}
        loading="lazy"
        draggable={false}
      />
    );
  }

  const t = TONES[((memory.tone % TONES.length) + TONES.length) % TONES.length];
  return (
    <svg
      className="memory-img"
      viewBox="0 0 100 100"
      preserveAspectRatio={large ? "xMidYMid meet" : "xMidYMid slice"}
      role="img"
      aria-label={`Placeholder picture for ${memory.caption}`}
    >
      <defs>
        <linearGradient id={`sky-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.sky[0]} />
          <stop offset="1" stopColor={t.sky[1]} />
        </linearGradient>
        <radialGradient id={`sun-${gid}`}>
          <stop offset="0" stopColor={t.sun} stopOpacity="1" />
          <stop offset="0.45" stopColor={t.sun} stopOpacity="0.75" />
          <stop offset="1" stopColor={t.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#sky-${gid})`} />
      <circle cx={66 + (memory.tone % 3) * 4} cy="32" r="22" fill={`url(#sun-${gid})`} />
      <path d="M0 66 C18 52 34 56 52 62 C70 68 86 56 100 60 L100 100 L0 100Z" fill={t.far} opacity="0.85" />
      <path d="M0 78 C22 68 44 76 64 74 C80 72 92 76 100 74 L100 100 L0 100Z" fill={t.near} opacity="0.95" />
      {/* a few simple stems and blossoms */}
      <g stroke={t.near} strokeWidth="0.7" fill="none" strokeLinecap="round">
        <path d="M14 100 C13 90 15 84 14 78" />
        <path d="M24 100 C25 92 23 88 24 83" />
        <path d="M86 100 C85 92 87 86 86 80" />
      </g>
      <g fill="#fff6ea" opacity="0.92">
        <circle cx="14" cy="77" r="2.3" />
        <circle cx="24" cy="82" r="1.8" />
        <circle cx="86" cy="79" r="2.1" />
      </g>
      <text
        x="50"
        y={large ? 93 : 92}
        textAnchor="middle"
        fontSize="4.6"
        letterSpacing="0.9"
        fill="#fff6ea"
        opacity="0.9"
        style={{ textTransform: "uppercase", fontFamily: "var(--font-body)" }}
      >
        placeholder photo
      </text>
    </svg>
  );
}
