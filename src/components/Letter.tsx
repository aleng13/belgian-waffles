import { LETTER, SHOW_EDIT_HINTS } from "../config/content";
import { useReveal } from "../hooks/useReveal";
import { FloralCluster, PressedFlower, Sprig } from "./Lilies";
import "./Letter.css";

export default function Letter() {
  const { ref, visible } = useReveal<HTMLDivElement>(0.2);

  return (
    <section className="section letter" id="letter" aria-labelledby="letter-title">
      <FloralCluster className="floral letter-lily letter-lily--tr" />
      <div className="section-inner">
        <div ref={ref} className={`letter-reveal ${visible ? "is-visible" : ""}`}>
          <div className="letter-sheet-wrap torn-wrap">
            <article className="letter-sheet torn">
              <span className="tape tape--rose letter-tape letter-tape--l" />
              <span className="tape tape--sage letter-tape letter-tape--r" />

              {SHOW_EDIT_HINTS && <span className="letter-edit">✎ editable placeholder</span>}

              <h2 className="letter-heading" id="letter-title">
                {LETTER.heading}
              </h2>

              <div className="letter-body">
                {LETTER.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <p className="letter-closing">{LETTER.closing}</p>

              <div className="letter-signoff">
                <span className="letter-heart" aria-hidden="true">
                  ♥
                </span>
                <p className="letter-sign">{LETTER.signoff}</p>
                <p className="letter-name">{LETTER.signature}</p>
              </div>

              <Sprig className="letter-sprig" />
              <PressedFlower className="letter-flower" />
            </article>
          </div>
        </div>

        <p className="letter-end" aria-hidden="true">
          the end of this page · not of us ♡
        </p>
      </div>
    </section>
  );
}
