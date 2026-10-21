import { PressedFlower } from "./Lilies";
import ScrapbookAccents from "./ScrapbookAccents";
import SectionHead from "./SectionHead";
import "./Songs.css";

export default function Songs() {
  return (
    <section className="section songs" id="songs" aria-labelledby="songs-title">
      <PressedFlower className="songs-flower songs-flower--a" />
      <PressedFlower className="songs-flower songs-flower--b" />
      <ScrapbookAccents section="songs" />
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
        <div className="spotify-playlist-card">
          <p className="spotify-playlist-note">Press play and let the songs bring back our little moments ♡</p>
          <iframe
            className="spotify-playlist-embed"
            title="Listen to our Spotify playlist"
            src="https://open.spotify.com/embed/playlist/4C3HmdWXUO8eFl8pcErS6l?utm_source=generator&theme=0"
            width="100%"
            height="384"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
