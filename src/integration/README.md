# Supabase login and Storage photos

The app uses Supabase email/password sign-in. After signing in, the Memories section reads images,
captions, and dates from a private Storage bucket. No database table is needed: captions and dates
for photos uploaded through the site are encoded in their Storage object filenames.

## Setup

1. In your Supabase project, open **Authentication → Sign In / Providers** and make sure the
   **Email** provider is enabled with password sign-in.
2. Under **Authentication → Users**, create the account for your email and set its password.
   Disable public sign-ups in the Authentication settings if only this account should be able to
   sign in. The app intentionally has no sign-up form.
3. In **Storage**, create or keep your bucket **private**. The default bucket name is
   `our-little-memories`;
   use another name if needed.
4. Leave the existing bucket visibility and policies unchanged. In **Storage → Policies**, verify
   that the existing policies grant list/read access to these two approved user IDs and upload
   access if you want to use the in-site upload form. Photo edit and delete controls use normal
   authenticated Storage operations: editing renames the object, and deleting removes it. The
   policies must allow those operations for the approved users; the frontend does not bypass them.
5. Copy `.env.example` to `.env.local`. In Supabase, find the project URL and public anon/publishable
   key in **Project Settings → API** (or **API Keys**), and put them in the file:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
   VITE_SUPABASE_BUCKET=our-little-memories
   ```

6. Restart the dev server (`npm run dev`) and sign in with the email and password you created.
   Upload a test image to the bucket in Supabase Storage. Refresh the site while signed in; it
   should appear in the Polaroids. The gallery reads supported image formats (AVIF, GIF, JPEG, PNG,
   and WebP) from the bucket, including folders; existing filenames become captions. The
   **+ add a photo** button lets either approved account upload a photo with a caption and optional
   date; those details are stored in its unique object filename. Use each Polaroid's three-dot menu
   to edit its caption/date or delete it. Editing renames the Storage object; if a policy denies
   that rename or deletion, the site shows the Storage error and the policy must be reviewed.

The app stores the Supabase session in the browser and signs Storage image URLs for thirty minutes.
It refreshes URLs after twenty minutes and when a tab becomes visible after the refresh interval.
Signing out hides the site and clears the Supabase session, but already-issued signed URLs remain
usable until they expire. Never share those URLs.

The upload form accepts AVIF, GIF, JPEG, PNG, and WebP files. Set the bucket's upload size limit in
Supabase to suit your photos. Open a Polaroid to see the full image without cropping. You do not
need to create a `memories` table in the Database section.

The app accepts `VITE_SUPABASE_PUBLISHABLE_KEY` (recommended) and continues to accept
`VITE_SUPABASE_ANON_KEY` for compatibility with the current local setup. Only the project URL and
public publishable/anon key belong in `.env.local`; never put a service-role or secret key in
frontend code or a `VITE_` variable. Without Supabase configuration, the site continues to show its
built-in placeholder Polaroids.

## Spotify vinyl player

The Songs section uses Spotify's Web Playback SDK and Web API. Each visitor connects their own
Spotify account separately from the site's Supabase login. The playlist is loaded from Spotify,
and the browser device plays it only after a user presses Play or selects a track.

1. In Spotify for Developers, open the app whose Client ID you provided. Add this exact local
   redirect URI under the app's Redirect URIs:

   ```text
   http://127.0.0.1:5173/
   ```

   For deployment, add the deployed HTTPS URL as a second redirect URI and set
   `VITE_SPOTIFY_REDIRECT_URI` to that exact value. Spotify does not accept `localhost` for HTTP
   redirects; use the loopback IP for local development.
2. Add the Spotify Client ID and redirect URI to your local `.env`:

   ```dotenv
   VITE_SPOTIFY_CLIENT_ID=your-spotify-client-id
   VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/
   ```

   The app uses Authorization Code with PKCE. It does not use or need a Spotify Client Secret.
3. Restart Vite and open the site at `http://127.0.0.1:5173/`. Sign into the site, choose
   **Connect Spotify**, and approve playback and playlist access. Each person must authorize their
   own Spotify account in their browser.
4. In Spotify's Developer Dashboard, verify the Client ID belongs to the correct app, its owner
   has Spotify Premium, and both Spotify accounts are listed under **Users Management** while the
   app is in Development Mode. Development Mode allows up to five users, and each account using
   Web Playback SDK streaming needs Premium.

The player requests `streaming`, `user-read-private`, `user-read-email`,
`user-modify-playback-state`, and `playlist-read-private` scopes. Album artwork is shown unaltered
on the stationary sleeve and links to its Spotify album; the player also links to the playlist.
The rotating vinyl does not display or transform the artwork. Playback begins only after a user
gesture, such as pressing Play or selecting a track; browsers and Spotify do not allow reliable
autoplay on page load. Spotify playback integrations must be non-commercial under Spotify's current
developer policy.
