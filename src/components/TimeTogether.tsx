import { useMemo } from "react";
import { RELATIONSHIP_START_ISO } from "../config/content";
import { useNow } from "../hooks/useNow";
import SectionHead from "./SectionHead";
import { FloralCluster } from "./Lilies";
import ScrapbookAccents from "./ScrapbookAccents";
import "./TimeTogether.css";

function split(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

type Props = { startIso?: string };

export default function TimeTogether({ startIso = RELATIONSHIP_START_ISO }: Props) {
  const start = useMemo(() => new Date(startIso).getTime(), [startIso]);
  const now = useNow(1000);
  const valid = Number.isFinite(start);

  const diff = valid ? now - start : 0;
  const upcoming = valid && diff < 0; // start is still in the future → count down instead
  const parts = split(Math.abs(diff));

  const startLabel = valid
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(start)
    : "";

  const cells: Array<{ label: string; value: string; tilt: number; tape: "" | "rose" | "sage" }> = [
    { label: "days", value: String(parts.days), tilt: -2.4, tape: "rose" },
    { label: "hours", value: pad(parts.hours), tilt: 1.6, tape: "" },
    { label: "minutes", value: pad(parts.minutes), tilt: -1.2, tape: "sage" },
    { label: "seconds", value: pad(parts.seconds), tilt: 2.2, tape: "rose" },
  ];

  const summary = `${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes and ${parts.seconds} seconds`;

  return (
    <section className="section us" id="us" aria-labelledby="us-title">
      <FloralCluster className="floral us-lily" variant="b" />
      <ScrapbookAccents section="us" />
      <div className="section-inner">
        <SectionHead
          id="us-title"
          kicker={upcoming ? "counting down to us" : "every little second"}
          title={
            upcoming ? (
              <>
                until our <em>story begins</em>
              </>
            ) : (
              <>
                our time <em>together</em>
              </>
            )
          }
          lede={
            valid
              ? upcoming
                ? `Our first day is ${startLabel}.`
                : `Counting from ${startLabel}, and still going.`
              : "Set a valid start time in src/config/content.ts."
          }
        />

        {valid && (
          <div className="ticket-row" role="timer" aria-label={`${upcoming ? "Time until" : "Time since"} ${startLabel}: ${summary}`}>
            {cells.map((c) => (
              <div
                key={c.label}
                className="ticket-wrap torn-wrap"
                style={{ transform: `rotate(${c.tilt}deg)` }}
              >
                <div className="ticket torn" aria-hidden="true">
                  <span className={`tape ticket-tape ${c.tape ? `tape--${c.tape}` : ""}`} />
                  <span className="ticket-value">{c.value}</span>
                  <span className="ticket-label">{c.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="us-caption">
          <span className="hint">{upcoming ? "almost there ♡" : "…and counting ♡"}</span>
        </p>
      </div>
    </section>
  );
}
