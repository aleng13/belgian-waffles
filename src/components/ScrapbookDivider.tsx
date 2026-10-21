import { CrochetHeart, PressedFlower, Sprig } from "./Lilies";
import "./ScrapbookDivider.css";

export default function ScrapbookDivider() {
  return (
    <div className="scrapbook-divider" aria-hidden="true">
      <span className="divider-tape divider-tape--left" />
      <Sprig className="divider-sprig divider-sprig--left" />
      <PressedFlower className="divider-flower divider-flower--left" />
      <CrochetHeart className="divider-heart" />
      <PressedFlower className="divider-flower divider-flower--right" />
      <Sprig className="divider-sprig divider-sprig--right" />
      <span className="divider-tape divider-tape--right" />
    </div>
  );
}
