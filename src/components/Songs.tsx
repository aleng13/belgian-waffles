import { PressedFlower } from "./Lilies";
import SectionHead from "./SectionHead";
import VinylPlayer from "./VinylPlayer";
import "./Songs.css";

export default function Songs() {
  return (
    <section className="section songs" id="songs" aria-labelledby="songs-title">
      <PressedFlower className="songs-flower songs-flower--a" />
      <PressedFlower className="songs-flower songs-flower--b" />
      <div className="section-inner">
        <SectionHead
          id="songs-title"
          kicker="put the needle down"
          title={
            <>
              songs that remind me of <em>you ♡</em>
            </>
          }
          lede="A few songs that keep a little piece of us inside them."
        />
        <VinylPlayer />
      </div>
    </section>
  );
}
