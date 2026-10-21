import { useCallback, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { Memory } from "../config/content";
import { SHOW_EDIT_HINTS } from "../config/content";
import { useElementWidth } from "../hooks/useElementWidth";
import { useMemories } from "../hooks/useMemories";
import Lightbox from "./Lightbox";
import MemoryPhoto from "./MemoryPhoto";
import { CrochetHeart, PressedFlower } from "./Lilies";
import ScrapbookAccents from "./ScrapbookAccents";
import SectionHead from "./SectionHead";
import "./Memories.css";

/** Small deterministic pseudo-random so lights/sway are varied but stable between renders. */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function photosPerRow(width: number): number {
  if (width < 560) return 3;
  if (width < 900) return 3;
  return 4;
}

type RowProps = {
  items: Memory[];
  firstIndex: number;
  rowIndex: number;
  width: number;
  perRow: number;
  onOpen: (index: number) => void;
};

/**
 * One length of twine. The twine is a quadratic curve; every Polaroid, clothespin and fairy light
 * is positioned on that same curve (see yAt), so everything genuinely hangs from the string.
 */
function HangingRow({
  items,
  firstIndex,
  rowIndex,
  width,
  perRow,
  onOpen,
}: RowProps) {
  const mobile = width < 560;
  const slot = width / perRow;
  const pw = Math.round(clamp(slot - (mobile ? 14 : 44), mobile ? 80 : 104, 232)); // Polaroid width
  const cardH = pw + 28;
  const hangH = 14 + cardH; // pin zone + card
  const y0 = 16;
  const sag = clamp(width * 0.036, 12, 36) * (0.85 + rand(rowIndex + 3) * 0.3);
  const height = Math.ceil(y0 + sag + hangH + 26);
  const startX = (width - items.length * slot) / 2;

  const yAt = (x: number) => {
    const t = x / width;
    return y0 + 4 * sag * t * (1 - t);
  };
  const slopeDeg = (x: number) => {
    const t = x / width;
    const dydx = (4 * sag * (1 - 2 * t)) / width;
    return (Math.atan(dydx) * 180) / Math.PI;
  };

  const pins = items.map((m, i) => {
    const cx = startX + slot * (i + 0.5);
    return { m, i, cx, py: yAt(cx) };
  });

  // crochet hearts dangle from the twine in some of the gaps (desktop/tablet only)
  const hearts = mobile
    ? []
    : pins.slice(0, -1).flatMap((_pin, i) => {
        if ((rowIndex + i) % 2 !== 0) return [];
        const x = startX + slot * (i + 1);
        return [{ x, y: yAt(x), key: `h${i}` }];
      });

  // fairy lights: evenly spaced along the wire, skipping the spots where pins/hearts sit
  const step = mobile ? 38 : 46;
  const count = Math.max(4, Math.floor(width / step));
  const bulbs = Array.from({ length: count }, (_, k) => {
    const x = (width / count) * (k + 0.5);
    return {
      k,
      x,
      y: yAt(x) + 3,
      delay: -rand(k * 5 + rowIndex * 37) * 6,
      dur: 3.6 + rand(k * 3 + rowIndex * 11) * 3,
    };
  }).filter(
    (b) => !pins.some((p) => Math.abs(p.cx - b.x) < 16) && !hearts.some((h) => Math.abs(h.x - b.x) < 18),
  );

  const d = `M0,${y0} Q${width / 2},${y0 + 2 * sag} ${width},${y0}`;
  const wire = `M0,${y0 + 3} Q${width / 2},${y0 + 3 + 2 * sag} ${width},${y0 + 3}`;

  return (
    <div className="hang-row" style={{ height }}>
      <svg className="twine" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={wire} fill="none" stroke="#5c4a3a" strokeOpacity="0.55" strokeWidth="0.9" />
        <path d={d} fill="none" stroke="#9c7f55" strokeWidth="2.6" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#dcc79d" strokeWidth="1.2" strokeDasharray="1.6 3.4" strokeLinecap="round" />
        <circle cx="2" cy={y0} r="3.4" fill="#7a6048" />
        <circle cx={width - 2} cy={y0} r="3.4" fill="#7a6048" />
      </svg>

      {hearts.map((h) => (
        <CrochetHeart
          key={h.key}
          className="crochet-heart"
          style={{ left: h.x - 11, top: h.y - 2 }}
        />
      ))}

      {pins.map(({ m, i, cx, py }) => {
        const style = {
          left: cx - pw / 2,
          top: py - 12,
          width: pw,
          "--tilt": `${m.tilt}deg`,
          "--pin-tilt": `${slopeDeg(cx) * 0.6}deg`,
          "--sway-dur": `${5.5 + rand(firstIndex + i + 9) * 3}s`,
          "--sway-delay": `${-rand(firstIndex + i + 21) * 6}s`,
        } as CSSProperties;
        return (
          <div
            key={m.id}
            className="hang"
            style={style}
          >
            <button
              type="button"
              className="hang-photo"
              onClick={() => onOpen(firstIndex + i)}
              aria-label={`Open photo: ${m.caption}`}
            >
              <span className="pin" aria-hidden="true" />
              <span className="polaroid" style={{ height: cardH }}>
                <span className="polaroid-photo" style={{ height: pw - 20 }}>
                  <MemoryPhoto memory={m} />
                </span>
                <span className="polaroid-caption">{m.caption}</span>
                {m.charm === "flower" && <PressedFlower className="charm-flower" />}
              </span>
            </button>
          </div>
        );
      })}

      {bulbs.map((b) => (
        <span
          key={b.k}
          className="bulb"
          aria-hidden="true"
          style={
            {
              left: b.x - 4.5,
              top: b.y,
              "--delay": `${b.delay}s`,
              "--dur": `${b.dur}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export default function Memories() {
  const { memories, status, error, canUpload, refresh, upload, update, remove } = useMemories();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [open, setOpen] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState<Memory | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editDate, setEditDate] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const perRow = photosPerRow(width);
  const rows = useMemo(() => {
    const out: Array<{ items: Memory[]; firstIndex: number }> = [];
    for (let i = 0; i < memories.length; i += perRow) {
      out.push({ items: memories.slice(i, i + perRow), firstIndex: i });
    }
    return out;
  }, [memories, perRow]);

  const close = useCallback(() => setOpen(null), []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setUploadError("Choose a photo to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadMessage("");
    try {
      await upload(file, caption, date || undefined);
      setFile(null);
      setCaption("");
      setDate("");
      if (fileInput.current) fileInput.current.value = "";
      if (await refresh()) {
        setUploadMessage("Your photo is pinned up ♡");
      } else {
        setUploadMessage("Your photo uploaded, but the gallery could not refresh. Reload the page to see it.");
      }
    } catch (cause: unknown) {
      setUploadError(cause instanceof Error ? cause.message : "Could not upload the photo.");
    } finally {
      setUploading(false);
    }
  }

  function getStoragePath(memory: Memory): string {
    const separator = memory.id.indexOf("/");
    if (separator < 0 || separator === memory.id.length - 1) {
      throw new Error("This photo is not stored in the gallery.");
    }
    return memory.id.slice(separator + 1);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setActionBusy(true);
    setActionError("");
    try {
      await update(getStoragePath(editing), editCaption, editDate || undefined);
      if (!(await refresh())) throw new Error("Photo updated, but the gallery could not refresh. Reload the page.");
      setEditing(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : "Could not update the photo.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setActionBusy(true);
    setActionError("");
    try {
      await remove(getStoragePath(deleting));
      setOpen(null);
      if (!(await refresh())) throw new Error("Photo deleted, but the gallery could not refresh. Reload the page.");
      setDeleting(null);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : "Could not delete the photo.");
    } finally {
      setActionBusy(false);
    }
  }

  function startEditing(memory: Memory) {
    setOpen(null);
    setDeleting(null);
    setActionError("");
    setEditing(memory);
    setEditCaption(memory.caption);
    setEditDate(memory.date ?? "");
  }

  function startDeleting(memory: Memory) {
    setOpen(null);
    setEditing(null);
    setActionError("");
    setDeleting(memory);
  }

  return (
    <section className="section memories" id="memories" aria-labelledby="memories-title">
      <ScrapbookAccents section="memories" />
      <div className="section-inner">
        <SectionHead
          id="memories-title"
          kicker="pinned up with tiny clothespins"
          title={
            <>
              our little <em>moments</em>
            </>
          }
          lede="Tap any photo to hold it a little closer."
        />

        {status === "loading" && (
          <p className="memories-hint" role="status">
            <span className="hint">gathering our little moments…</span>
          </p>
        )}
        {status === "empty" && (
          <p className="memories-hint" role="status">
            <span className="hint">no photos yet · add the first one above ♡</span>
          </p>
        )}

        <div className="hang-rows" ref={ref}>
          {rows.map((r, idx) => (
            <HangingRow
              key={`${perRow}-${r.firstIndex}`}
              items={r.items}
              firstIndex={r.firstIndex}
              rowIndex={idx}
              width={width}
              perRow={perRow}
              onOpen={setOpen}
            />
          ))}
        </div>

        {(editing || deleting) && (
          <div className="photo-action-panel">
            {editing && (
              <form className="photo-upload-form" onSubmit={(event) => void handleEditSubmit(event)}>
                <h3>Edit photo details</h3>
                <label htmlFor="edit-memory-caption">Caption</label>
                <input
                  id="edit-memory-caption"
                  type="text"
                  value={editCaption}
                  maxLength={100}
                  required
                  onChange={(event) => setEditCaption(event.currentTarget.value)}
                />
                <label htmlFor="edit-memory-date">Date <span>(optional)</span></label>
                <input
                  id="edit-memory-date"
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.currentTarget.value)}
                />
                {actionError && <p className="photo-upload-error" role="alert">{actionError}</p>}
                <div className="photo-action-buttons">
                  <button className="photo-upload-submit" type="submit" disabled={actionBusy}>
                    {actionBusy ? "saving…" : "save changes"}
                  </button>
                  <button className="photo-upload-submit" type="button" onClick={() => setEditing(null)} disabled={actionBusy}>
                    cancel
                  </button>
                </div>
              </form>
            )}
            {deleting && (
              <div className="photo-upload-form">
                <h3>Remove this photo?</h3>
                <p>This will permanently delete “{deleting.caption}” from the gallery.</p>
                {actionError && <p className="photo-upload-error" role="alert">{actionError}</p>}
                <div className="photo-action-buttons">
                  <button className="photo-upload-submit" type="button" onClick={() => void handleDelete()} disabled={actionBusy}>
                    {actionBusy ? "deleting…" : "delete photo"}
                  </button>
                  <button className="photo-upload-submit" type="button" onClick={() => setDeleting(null)} disabled={actionBusy}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <p className="memories-hint" role="alert">
            <span className="hint">Couldn’t load the photos: {error}</span>
          </p>
        )}

        {SHOW_EDIT_HINTS && (status === "connected" || status === "placeholders") && (
          <p className="memories-hint">
            <span className="hint">
              {status === "connected"
                ? "little moments, pinned with love"
                : "placeholder photos · add your own little moments"}
            </span>
          </p>
        )}

        {canUpload && (
          <div className="photo-upload">
            <button
              className="photo-upload-toggle"
              type="button"
              aria-expanded={uploadOpen}
              aria-controls="photo-upload-form"
              onClick={() => {
                setUploadOpen((current) => !current);
                setUploadError("");
                setUploadMessage("");
              }}
            >
              {uploadOpen ? "close ×" : "+ add a photo"}
            </button>

            {uploadOpen && (
              <form id="photo-upload-form" className="photo-upload-form" onSubmit={handleUpload}>
                <label htmlFor="memory-file">Photo</label>
                <input
                  ref={fileInput}
                  id="memory-file"
                  type="file"
                  accept=".avif,.gif,.jpg,.jpeg,.png,.webp,image/avif,image/gif,image/jpeg,image/png,image/webp"
                  required
                  onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)}
                />

                <label htmlFor="memory-caption">Caption</label>
                <input
                  id="memory-caption"
                  type="text"
                  value={caption}
                  maxLength={100}
                  placeholder="our little moment"
                  required
                  onChange={(event) => setCaption(event.currentTarget.value)}
                />

                <label htmlFor="memory-date">Date <span>(optional)</span></label>
                <input
                  id="memory-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.currentTarget.value)}
                />

                {uploadError && <p className="photo-upload-error" role="alert">{uploadError}</p>}
                {uploadMessage && <p className="photo-upload-success" role="status">{uploadMessage}</p>}

                <button className="photo-upload-submit" type="submit" disabled={uploading}>
                  {uploading ? "pinning it up…" : "upload photo"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {open !== null && (
        <Lightbox
          memories={memories}
          index={open}
          onClose={close}
          onNavigate={setOpen}
          onEdit={startEditing}
          onDelete={startDeleting}
        />
      )}
    </section>
  );
}
