import { CrochetHeart, PressedFlower, Sprig } from "./Lilies";
import "./ScrapbookAccents.css";

type Props = {
  section: "memories" | "songs" | "us" | "quiz";
};

export default function ScrapbookAccents({ section }: Props) {
  return (
    <div className={`scrapbook-accents scrapbook-accents--${section}`} aria-hidden="true">
      <span className="scrap-washi" />
      <span className="scrap-stamp">♡</span>
      <PressedFlower className="scrap-pressed-flower" />
      <PressedFlower className="scrap-pressed-flower scrap-pressed-flower--small" />
      <CrochetHeart className="scrap-dangling-heart" />
      <Sprig className="scrap-sprig" />
      <span className="scrap-doodle scrap-doodle--sparkle">✳</span>
      <span className="scrap-doodle scrap-doodle--heart">♡</span>
    </div>
  );
}
