import { RELATIONSHIP_START_ISO } from "../config/content";
import { FloralCluster } from "./Lilies";
import "./Hero.css";

const HEARTS = [
  { top: "24%", left: "74%", size: 0.9, delay: 0 },
  { top: "34%", left: "90%", size: 1.1, delay: 1.2 },
  { top: "70%", left: "20%", size: 0.8, delay: 2.1 },
  { top: "82%", left: "62%", size: 0.95, delay: 0.6 },
  { top: "16%", left: "36%", size: 0.7, delay: 1.8 },
];

function startLabel(): string | null {
  const d = new Date(RELATIONSHIP_START_ISO);
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} · ${get("month")} · ${get("year")}`;
}

export default function Hero() {
  const since = startLabel();
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <FloralCluster className="floral hero-lily hero-lily--tl" />
      <FloralCluster className="floral hero-lily hero-lily--br" variant="b" />

      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="hero-heart"
          aria-hidden="true"
          style={{ top: h.top, left: h.left, fontSize: `${h.size}rem`, animationDelay: `${h.delay}s` }}
        >
          ♡
        </span>
      ))}

      <span className="hero-scribble hero-scribble--l" aria-hidden="true">
        page one
      </span>
      <span className="hero-scribble hero-scribble--r" aria-hidden="true">
        read slowly ♡
      </span>

      <div className="hero-content">
        <p className="paper-label">TO MY FAVOURITE PERSON</p>

        <h1 className="hero-title" id="hero-title">
          our little corner <em>of forever</em>
        </h1>

        <p className="hero-sub">for all the little moments that became our favourite memories</p>

        {since && (
          <p className="hero-since" aria-hidden="true">
            since {since}
          </p>
        )}

        <div className="hero-note-wrap torn-wrap">
          <p className="hero-note torn">
            With you, even the smallest moments become memories I want to keep forever.
          </p>
        </div>
      </div>

      <a className="scroll-hint" href="#memories">
        <span>scroll to explore</span>
        <span className="scroll-hint-line" aria-hidden="true" />
      </a>
    </section>
  );
}
