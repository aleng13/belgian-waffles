# our little corner of forever
A vintage floral scrapbook anniversary site (React + TypeScript + Vite).

    npm install
    npm run dev      # preview
    npm run build    # production build

Everything you'll want to edit (memories, songs, quiz, letter, start date) is in `src/config/content.ts`.
The vinyl player is isolated in `src/components/VinylPlayer.tsx` + `VinylPlayer.css`.
To enable email/password sign-in and load photos from Supabase Storage, copy `.env.example` to
`.env.local`, set the Supabase project URL, public anon key, and bucket name, then follow the setup
in `src/integration/README.md`. The site still works with placeholder photos when Supabase is not configured.
