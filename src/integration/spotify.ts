const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim();
const REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI?.trim() ||
  (typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`);
const TOKEN_STORAGE_KEY = "our-little-corner.spotify-token.v2";
const LEGACY_TOKEN_STORAGE_KEY = "our-little-corner.spotify-token";
const STATE_STORAGE_KEY = "our-little-corner.spotify-state";
const VERIFIER_STORAGE_KEY = "our-little-corner.spotify-verifier";
const PLAYLIST_ID = "4C3HmdWXUO8eFl8pcErS6l";
const SCOPES = [
  "streaming",
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "playlist-read-private",
].join(" ");

type SpotifyToken = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: number;
};

export type SpotifyTrack = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  albumUrl: string;
  playlistPosition: number;
  artworkUrl?: string;
};

export type PlaylistDiagnostics = {
  totalItems: number;
  playableItems: number;
  nullItems: number;
  restrictedItems: number;
  localItems: number;
  nonTrackItems: number;
};

export type SpotifyPlayerTrack = {
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string }> };
};

export type SpotifyPlayerState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: SpotifyPlayerTrack };
};

export interface SpotifyWebPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  togglePlay(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  addListener(event: "ready" | "not_ready", callback: (data: { device_id: string }) => void): boolean;
  addListener(
    event: "player_state_changed",
    callback: (state: SpotifyPlayerState | null) => void,
  ): boolean;
  addListener(
    event: "initialization_error" | "authentication_error" | "account_error" | "playback_error",
    callback: (data: { message: string }) => void,
  ): boolean;
}

type SpotifySdk = {
  Player: new (options: {
    name: string;
    volume: number;
    getOAuthToken: (callback: (token: string) => void) => void;
  }) => SpotifyWebPlayer;
};

declare global {
  interface Window {
    Spotify?: SpotifySdk;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

type PlaylistTrack = {
    id: string | null;
    uri: string;
    name: string;
    type: string;
    is_local: boolean;
    is_playable?: boolean;
    artists: Array<{ name: string }>;
    album: { id: string; name: string; images: Array<{ url: string }> };
};

type PlaylistEntry = {
  item?: PlaylistTrack | null;
  track?: PlaylistTrack | null;
};

type PlaylistPage = {
  items: PlaylistEntry[];
  next: string | null;
};

export type PlaylistTracksResult = {
  tracks: SpotifyTrack[];
  diagnostics: PlaylistDiagnostics;
};

let sdkLoading: Promise<SpotifySdk> | undefined;

function getClientId(): string {
  if (!CLIENT_ID) {
    throw new Error("Add VITE_SPOTIFY_CLIENT_ID to your local .env file and restart the dev server.");
  }
  return CLIENT_ID;
}

function encodeBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier(): string {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(64)));
}

async function createChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return encodeBase64Url(new Uint8Array(digest));
}

function readToken(): SpotifyToken | null {
  sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const token = JSON.parse(raw) as SpotifyToken;
    return token.access_token && Number.isFinite(token.expires_at) ? token : null;
  } catch {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

function storeToken(token: Omit<SpotifyToken, "expires_at">): SpotifyToken {
  const session: SpotifyToken = { ...token, expires_at: Date.now() + token.expires_in * 1000 };
  sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function hasSpotifyClientId(): boolean {
  return Boolean(CLIENT_ID);
}

export function hasSpotifySession(): boolean {
  return Boolean(readToken());
}

export async function beginSpotifyAuthorization(): Promise<void> {
  const clientId = getClientId();
  if (!REDIRECT_URI) throw new Error("A Spotify redirect URL is not available in this browser.");

  const verifier = randomVerifier();
  const state = randomVerifier();
  sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.search = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge_method: "S256",
    code_challenge: await createChallenge(verifier),
  }).toString();
  window.location.assign(authorizeUrl);
}

export async function handleSpotifyCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (!code && !error) return false;

  const returnedState = url.searchParams.get("state");
  const expectedState = sessionStorage.getItem(STATE_STORAGE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  window.history.replaceState({}, document.title, url);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);

  if (error) throw new Error(`Spotify authorization was declined: ${error}`);
  if (!code) throw new Error("Spotify did not return an authorization code. Please connect again.");
  if (!returnedState || returnedState !== expectedState) {
    throw new Error("Spotify sign-in could not be verified. Please connect again.");
  }
  if (!verifier || !REDIRECT_URI) {
    throw new Error("Spotify sign-in expired. Please connect again.");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) {
    throw new Error(`Spotify token exchange failed (${response.status}). Please connect again.`);
  }
  storeToken((await response.json()) as Omit<SpotifyToken, "expires_at">);
  return true;
}

export async function getSpotifyAccessToken(): Promise<string | null> {
  const token = readToken();
  if (!token) return null;
  if (token.expires_at > Date.now() + 60_000) return token.access_token;

  if (!token.refresh_token) {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    }),
  });
  if (!response.ok) {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    throw new Error(`Spotify session expired (${response.status}). Please connect again.`);
  }

  const refreshed = (await response.json()) as Omit<SpotifyToken, "expires_at">;
  const updated = storeToken({
    ...refreshed,
    refresh_token: refreshed.refresh_token ?? token.refresh_token,
  });
  return updated.access_token;
}

export function disconnectSpotify(): void {
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function getPlaylistTracks(accessToken: string): Promise<PlaylistTracksResult> {
  const tracks: SpotifyTrack[] = [];
  const diagnostics: PlaylistDiagnostics = {
    totalItems: 0,
    playableItems: 0,
    nullItems: 0,
    restrictedItems: 0,
    localItems: 0,
    nonTrackItems: 0,
  };
  let nextUrl: string | null =
    `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items?limit=100&market=from_token`;

  while (nextUrl) {
    if (!nextUrl.startsWith("https://api.spotify.com/v1/playlists/")) {
      throw new Error("Spotify returned an unexpected playlist page URL.");
    }
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(
        `Could not load the Spotify playlist (${response.status}). Check playlist access and Spotify app permissions.`,
      );
    }
    const page = (await response.json()) as PlaylistPage;
    for (const item of page.items) {
      const playlistPosition = diagnostics.totalItems;
      diagnostics.totalItems += 1;
      const track = item.item ?? item.track ?? null;
      if (!track) {
        diagnostics.nullItems += 1;
        continue;
      }
      if (track.type !== "track") {
        diagnostics.nonTrackItems += 1;
        continue;
      }
      if (track.is_local) {
        diagnostics.localItems += 1;
        continue;
      }
      if (track.is_playable === false || !track.uri) {
        diagnostics.restrictedItems += 1;
        continue;
      }
      diagnostics.playableItems += 1;
      tracks.push({
        id: track.id ?? track.uri,
        uri: track.uri,
        title: track.name,
        artist: track.artists.map((artist) => artist.name).join(", "),
        album: track.album.name,
        albumUrl: `https://open.spotify.com/album/${track.album.id}`,
        playlistPosition,
        artworkUrl: track.album.images[0]?.url,
      });
    }
    nextUrl = page.next;
  }

  return { tracks, diagnostics };
}

export async function loadSpotifyWebPlaybackSdk(): Promise<SpotifySdk> {
  if (window.Spotify) return window.Spotify;
  if (sdkLoading) return sdkLoading;

  sdkLoading = new Promise<SpotifySdk>((resolve, reject) => {
    const previousCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previousCallback?.();
      if (window.Spotify) resolve(window.Spotify);
      else reject(new Error("Spotify's playback SDK did not initialize."));
    };

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("Could not load Spotify's playback SDK."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    sdkLoading = undefined;
    throw error;
  });

  return sdkLoading;
}

export async function startPlaylistTrack(
  accessToken: string,
  deviceId: string,
  trackUri: string,
): Promise<void> {
  if (!trackUri.startsWith("spotify:track:")) {
    throw new Error("Spotify returned an invalid track URI. Choose another track or reconnect Spotify.");
  }
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context_uri: `spotify:playlist:${PLAYLIST_ID}`,
        offset: { uri: trackUri },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Spotify could not start playback (${response.status}). Check Premium, app access, and available Spotify devices.`,
    );
  }
}
