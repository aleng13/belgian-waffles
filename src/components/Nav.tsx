import { useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "../config/content";
import { useActiveSection } from "../hooks/useActiveSection";
import "./Nav.css";

const IDS = NAV_LINKS.map((l) => l.id);

export default function Nav() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection(IDS);
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onResize = () => window.innerWidth > 760 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className="nav" ref={rootRef}>
      <div className="nav-bar">
        <a className="nav-brand" href="#home" onClick={() => setOpen(false)}>
          <span aria-hidden="true">♡</span> our corner
        </a>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-toggle-label">{open ? "close" : "menu"}</span>
          <span className="nav-toggle-bars" aria-hidden="true" />
        </button>

        <nav aria-label="Main">
          <ul id="site-menu" className={`nav-links ${open ? "is-open" : ""}`}>
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  className={active === l.id ? "is-active" : ""}
                  aria-current={active === l.id ? "location" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
