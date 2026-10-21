import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

type Props = {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  id?: string;
};

export default function SectionHead({ kicker, title, lede, id }: Props) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`section-head reveal ${visible ? "is-visible" : ""}`}>
      <span className="kicker">{kicker}</span>
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {lede && <p className="section-lede">{lede}</p>}
      <div className="hairline" aria-hidden="true">
        ♡
      </div>
    </div>
  );
}
