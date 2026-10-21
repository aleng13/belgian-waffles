import { useEffect, useRef, useState } from "react";
import { PARTNER_NAME, QUIZ, QUIZ_NOTE, QUIZ_RESULTS, SHOW_EDIT_HINTS } from "../config/content";
import SectionHead from "./SectionHead";
import ScrapbookAccents from "./ScrapbookAccents";
import "./Quiz.css";

const LETTERS = ["A", "B", "C", "D"];

export default function Quiz() {
  const total = QUIZ.length;
  const [step, setStep] = useState(0); // 0 … total-1 = questions, total = result
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [answers, setAnswers] = useState<Array<number | null>>(() => QUIZ.map(() => null));
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const firstRender = useRef(true);

  // After moving between screens, put keyboard/screen-reader focus on the new heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const done = step >= total;
  const question = done ? null : QUIZ[step];
  const picked = done ? null : answers[step];
  const reply = question && picked != null ? question.options[picked].reply : null;

  const score = answers.reduce<number>(
    (n, a, i) => (a != null && QUIZ[i].options[a].match ? n + 1 : n),
    0,
  );

  const choose = (index: number) =>
    setAnswers((prev) => {
      const next = prev.slice();
      next[step] = index;
      return next;
    });

  const go = (to: number, direction: "fwd" | "back") => {
    setDir(direction);
    setStep(to);
  };

  const restart = () => {
    setAnswers(QUIZ.map(() => null));
    go(0, "back");
  };

  const result = score >= total - 1 ? QUIZ_RESULTS.high : score >= 2 ? QUIZ_RESULTS.mid : QUIZ_RESULTS.low;
  const fill = (s: string) => s.replace("{name}", PARTNER_NAME);

  return (
    <section className="section quiz" id="quiz" aria-labelledby="quiz-title">
      <ScrapbookAccents section="quiz" />
      <div className="section-inner">
        <SectionHead
          id="quiz-title"
          kicker="no wrong answers, promise"
          title={
            <>
              how well do you <em>know us?</em>
            </>
          }
          lede="Five little questions. Take your time."
        />

        <div className="quiz-page">
          <span className="tape tape--rose quiz-tape quiz-tape--l" />
          <span className="tape tape--sage quiz-tape quiz-tape--r" />

          {!done && question ? (
            <div className={`quiz-step quiz-step--${dir}`} key={step}>
              <div
                className="quiz-progress"
                role="progressbar"
                aria-label="Quiz progress"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={step + 1}
                aria-valuetext={`Question ${step + 1} of ${total}`}
              >
                {QUIZ.map((q, i) => (
                  <span
                    key={q.id}
                    className={`quiz-dot ${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}`}
                    aria-hidden="true"
                  >
                    {i < step || i === step ? "♥" : "♡"}
                  </span>
                ))}
                <span className="quiz-count">
                  {step + 1} of {total}
                </span>
              </div>

              <fieldset className="quiz-fieldset">
                <legend className="quiz-legend">
                  <h3 ref={headingRef} tabIndex={-1} className="quiz-question">
                    {question.prompt}
                  </h3>
                </legend>

                <div className="quiz-options">
                  {question.options.map((opt, i) => (
                    <label key={opt.text} className={`quiz-option ${picked === i ? "is-picked" : ""}`}>
                      <input
                        type="radio"
                        name={`quiz-${question.id}`}
                        value={i}
                        checked={picked === i}
                        onChange={() => choose(i)}
                      />
                      <span className="quiz-option-body">
                        <span className="quiz-letter" aria-hidden="true">
                          {LETTERS[i]}
                        </span>
                        <span className="quiz-option-text">{opt.text}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <p className={`quiz-feedback ${reply ? "has-reply" : ""}`} aria-live="polite">
                {reply ?? "Pick the one that feels most like us."}
              </p>

              <div className="quiz-actions">
                <button
                  type="button"
                  className="quiz-btn"
                  onClick={() => go(step - 1, "back")}
                  disabled={step === 0}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="quiz-btn quiz-btn--primary"
                  onClick={() => go(step + 1, "fwd")}
                  disabled={picked == null}
                >
                  {step === total - 1 ? "See our result" : "Next →"}
                </button>
              </div>
            </div>
          ) : (
            <div className="quiz-step quiz-step--fwd quiz-result" key="result">
              <span className="quiz-result-heart" aria-hidden="true">
                ♥
              </span>
              <h3 ref={headingRef} tabIndex={-1} className="quiz-result-title">
                {result.title}
              </h3>
              <p className="quiz-result-score">
                We matched on {score} of {total}.
              </p>
              <p className="quiz-result-body">{fill(result.body)}</p>
              <p className="quiz-result-footer">{QUIZ_RESULTS.footer}</p>
              <div className="quiz-actions quiz-actions--center">
                <button type="button" className="quiz-btn" onClick={() => go(total - 1, "back")}>
                  ← Change an answer
                </button>
                <button type="button" className="quiz-btn quiz-btn--primary" onClick={restart}>
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>

        {SHOW_EDIT_HINTS && (
          <p className="quiz-hint">
            <span className="hint">{QUIZ_NOTE}</span>
          </p>
        )}
      </div>
    </section>
  );
}
