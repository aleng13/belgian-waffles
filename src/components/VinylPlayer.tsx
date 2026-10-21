import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SONGS } from "../config/content";
import type {
  PlaylistDiagnostics,
  SpotifyPlayerState,
  SpotifyWebPlayer,
  SpotifyTrack,
} from "../integration/spotify";
import "./VinylPlayer.css";

export type Track = SpotifyTrack & { color: string };

const PALETTE = SONGS.map((song) => song.color);
const spotifyConfigured = Boolean(import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim());
const PLAYLIST_URL = "https://open.spotify.com/playlist/4C3HmdWXUO8eFl8pcErS6l";

function formatSpotifyTrack(track: SpotifyTrack, index: number): Track {
  return { ...track, color: PALETTE[index % PALETTE.length] ?? "#b9787e" };
}

export default function VinylPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlistDiagnostics, setPlaylistDiagnostics] = useState<PlaylistDiagnostics>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTrackUri, setActiveTrackUri] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [deviceId, setDeviceId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const playerRef = useRef<SpotifyWebPlayer | null>(null);
  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const selectedTrack = tracks[selectedIndex];
  const currentTrack = tracks.find((track) => track.uri === activeTrackUri) ?? selectedTrack;

  const loadTracks = useCallback(async (token: string) => {
    const { getPlaylistTracks } = await import("../integration/spotify");
    const result = await getPlaylistTracks(token);
    setPlaylistDiagnostics(result.diagnostics);
    setTracks(result.tracks.map(formatSpotifyTrack));
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    let active = true;
    async function initializeAuthorization() {
      try {
        const { getSpotifyAccessToken, handleSpotifyCallback } = await import("../integration/spotify");
        const returnedFromSpotify = await handleSpotifyCallback();
        const token = await getSpotifyAccessToken();
        if (!active) return;
        if (token) {
          setAccessToken(token);
          await loadTracks(token);
        } else if (returnedFromSpotify) {
          throw new Error("Spotify did not return a usable session. Please connect again.");
        }
      } catch (cause: unknown) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not connect to Spotify.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void initializeAuthorization();
    return () => {
      active = false;
    };
  }, [loadTracks]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    let player: SpotifyWebPlayer | undefined;

    async function initializePlayer() {
      try {
        const { getSpotifyAccessToken, loadSpotifyWebPlaybackSdk } = await import("../integration/spotify");
        const sdk = await loadSpotifyWebPlaybackSdk();
        if (!active) return;
        player = new sdk.Player({
          name: "Our Little Corner",
          volume: 0.65,
          getOAuthToken: (callback) => {
            void getSpotifyAccessToken()
              .then((token) => callback(token ?? ""))
              .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "Spotify sign-in expired.");
                callback("");
              });
          },
        });
        playerRef.current = player;
        player.addListener("ready", ({ device_id }) => {
          if (active) setDeviceId(device_id);
        });
        player.addListener("not_ready", () => {
          if (active) setDeviceId(undefined);
        });
        player.addListener("player_state_changed", (state: SpotifyPlayerState | null) => {
          if (!active) return;
          if (!state) {
            setPlaying(false);
            setActiveTrackUri(undefined);
            return;
          }
          setPlaying(!state.paused);
          setActiveTrackUri(state.track_window.current_track.uri);
          const index = tracksRef.current.findIndex((track) => track.uri === state.track_window.current_track.uri);
          if (index >= 0) setSelectedIndex(index);
        });
        for (const event of ["initialization_error", "authentication_error", "account_error", "playback_error"] as const) {
          player.addListener(event, ({ message }) => {
            if (active) setError(message);
          });
        }

        const connected = await player.connect();
        if (!connected && active) setError("Spotify could not connect the browser player.");
      } catch (cause: unknown) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not start Spotify playback.");
      }
    }

    void initializePlayer();
    return () => {
      active = false;
      player?.disconnect();
      if (playerRef.current === player) playerRef.current = null;
      setDeviceId(undefined);
      setPlaying(false);
    };
  }, [accessToken]);

  async function handleConnect() {
    setError("");
    try {
      const { beginSpotifyAuthorization } = await import("../integration/spotify");
      await beginSpotifyAuthorization();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not start Spotify sign-in.");
    }
  }

  async function playTrack(index: number) {
    if (!deviceId) {
      setError("The Spotify browser player is still connecting. Try again in a moment.");
      return;
    }
    const { getSpotifyAccessToken, startPlaylistTrack } = await import("../integration/spotify");
    const token = await getSpotifyAccessToken();
    if (!token) {
      setAccessToken(undefined);
      throw new Error("Connect your Spotify account before starting playback.");
    }
    await playerRef.current?.activateElement();
    const track = tracks[index];
    if (!track) throw new Error("Choose a track from the playlist before starting playback.");
    await startPlaylistTrack(token, deviceId, track.uri);
  }

  async function handlePlayPause() {
    if (!selectedTrack) return;
    setBusy(true);
    setError("");
    try {
      if (!accessToken) {
        await handleConnect();
        return;
      }
      if (playing && activeTrackUri === selectedTrack.uri) {
        await playerRef.current?.togglePlay();
      } else {
        await playTrack(selectedIndex);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Spotify playback could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSelect(index: number) {
    setSelectedIndex(index);
    setError("");
    if (!accessToken) {
      await handleConnect();
      return;
    }
    setBusy(true);
    try {
      await playTrack(index);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not play the selected Spotify track.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip(direction: "previous" | "next") {
    if (!playerRef.current || !deviceId || !activeTrackUri) return;
    setBusy(true);
    setError("");
    try {
      if (direction === "previous") await playerRef.current.previousTrack();
      else await playerRef.current.nextTrack();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Spotify could not skip the track.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="vinyl-player" aria-label="Our Spotify playlist">
      <div className="vinyl-scene">
        <div className="vinyl-sleeve" aria-label={currentTrack ? `Album artwork for ${currentTrack.album}` : "Album artwork"}>
          {currentTrack?.artworkUrl ? (
            <a
              className="vinyl-sleeve-link"
              href={currentTrack.albumUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${currentTrack.album} on Spotify`}
            >
              <img
                className="vinyl-sleeve-artwork"
                src={currentTrack.artworkUrl}
                alt={`Album artwork for ${currentTrack.album}`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </a>
          ) : (
            <div className="vinyl-sleeve-placeholder" aria-hidden="true">
              <span>♡</span>
              <small>OUR LITTLE MIX</small>
            </div>
          )}
        </div>

        <div
          className={`vinyl-disc ${playing ? "is-spinning" : ""}`}
          style={{ "--record-label": currentTrack?.color ?? "#b9787e" } as CSSProperties}
          role="img"
          aria-label={`${currentTrack?.title ?? "Spotify"} vinyl record${playing ? ", spinning" : ""}`}
        >
          <div className="vinyl-reflection" aria-hidden="true" />
          <div className="vinyl-grooves" aria-hidden="true" />
          <div className="vinyl-label">
            <span className="vinyl-label-small">OUR LITTLE CORNER</span>
            <span className="vinyl-label-heart">♡</span>
            <span className="vinyl-label-title">SIDE A</span>
            <span className="vinyl-spindle" />
          </div>
        </div>
      </div>

      <div className="vinyl-information">
        <p className="vinyl-eyebrow">THE SOUNDTRACK OF US</p>
        <h3>{currentTrack?.title ?? "Our little playlist"}</h3>
        <p className="vinyl-artist">{currentTrack?.artist ?? "Connect Spotify to see its songs"}</p>

        <div className="vinyl-controls" aria-label="Spotify playback controls">
          <button
            type="button"
            className="vinyl-button vinyl-icon-button"
            onClick={() => void handleSkip("previous")}
            disabled={!activeTrackUri || busy}
            aria-label="Previous track"
          >
            <span aria-hidden="true">|◀</span>
          </button>
          <button
            type="button"
            className="vinyl-button vinyl-button-primary"
            onClick={() => void handlePlayPause()}
            disabled={loading || busy}
            aria-label={playing ? "Pause Spotify playback" : "Play selected Spotify track"}
          >
            {loading ? "loading…" : playing ? "Ⅱ pause" : spotifyConfigured ? "▶ play" : "set up Spotify"}
          </button>
          <button
            type="button"
            className="vinyl-button vinyl-icon-button"
            onClick={() => void handleSkip("next")}
            disabled={!activeTrackUri || busy}
            aria-label="Next track"
          >
            <span aria-hidden="true">▶|</span>
          </button>
        </div>

        {!accessToken && (
          <button type="button" className="spotify-connect" onClick={() => void handleConnect()} disabled={loading}>
            Connect Spotify
          </button>
        )}
        {!deviceId && accessToken && !error && (
          <p className="vinyl-audio-note" role="status">Connecting the Spotify player…</p>
        )}
        {error && <p className="spotify-error" role="alert">{error}</p>}
      </div>

      <div className="vinyl-tracklist">
        {tracks.length === 0 ? (
          <p className="spotify-empty">
            {loading
              ? "Finding the songs in your playlist…"
              : playlistDiagnostics
                ? `Spotify returned ${playlistDiagnostics.totalItems} playlist items: ${playlistDiagnostics.playableItems} playable, ${playlistDiagnostics.nullItems} null, ${playlistDiagnostics.restrictedItems} restricted, ${playlistDiagnostics.localItems} local, and ${playlistDiagnostics.nonTrackItems} non-track. Check the playlist contents and your Spotify market.`
                : "Connect Spotify to load the playlist tracks."}
          </p>
        ) : (
          tracks.map((track, index) => (
            <button
              type="button"
              key={`${track.uri}-${index}`}
              className={`vinyl-track ${selectedIndex === index ? "is-selected" : ""}`}
              onClick={() => void handleSelect(index)}
              aria-pressed={selectedIndex === index}
              disabled={busy}
            >
              <span className="vinyl-track-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="vinyl-track-copy">
                <span className="vinyl-track-title">{track.title}</span>
                <span className="vinyl-track-artist">{track.artist}</span>
              </span>
              <span className="vinyl-track-heart" aria-hidden="true">
                {activeTrackUri === track.uri && playing ? "♫" : selectedIndex === index ? "♥" : "♡"}
              </span>
            </button>
          ))
        )}
        {playlistDiagnostics && tracks.length > 0 && playlistDiagnostics.playableItems < playlistDiagnostics.totalItems && (
          <p className="spotify-diagnostic" role="status">
            Loaded {playlistDiagnostics.playableItems} playable tracks from {playlistDiagnostics.totalItems} items.
            {" "}{playlistDiagnostics.nullItems} unavailable, {playlistDiagnostics.restrictedItems} restricted,
            {" "}{playlistDiagnostics.localItems} local, {playlistDiagnostics.nonTrackItems} non-track.
          </p>
        )}
      </div>

      <p className="vinyl-note">
        every song keeps a little piece of us ♡ ·{" "}
        <a className="spotify-attribution" href={PLAYLIST_URL} target="_blank" rel="noreferrer">
          playlist and artwork by Spotify
        </a>
      </p>
    </section>
  );
}
