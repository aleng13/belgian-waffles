import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LilyDefs } from "./components/Lilies";
import Login from "./components/Login";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Memories from "./components/Memories";
import Songs from "./components/Songs";
import TimeTogether from "./components/TimeTogether";
import Quiz from "./components/Quiz";
import { supabase, supabaseConfigured, supabaseConfigurationError } from "./integration/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState("");

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(`Could not sign out: ${error.message}`);
      return;
    }
    setAuthError("");
  }

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthLoading(false);
      setAuthError("");
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      else setSession(data.session);
      setAuthLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setAuthError(cause instanceof Error ? cause.message : "Could not check your sign-in session.");
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (supabaseConfigured && authLoading) {
    return <main className="auth-message" role="status">Checking your sign-in…</main>;
  }

  if (supabaseConfigurationError) {
    return (
      <main className="auth-message" role="alert">
        Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the app.
      </main>
    );
  }

  if (supabaseConfigured && !session) {
    return (
      <>
        {authError && <p className="auth-error-banner" role="alert">{authError}</p>}
        <Login />
      </>
    );
  }

  return (
    <>
      <LilyDefs />
      <a className="skip-link" href="#memories">
        Skip to memories
      </a>
      <Nav />
      <main>
        <Hero />
        <Memories />
        <Songs />
        <TimeTogether />
        <Quiz />
      </main>
      <footer className="site-footer">
        made with all my love ♡
        {session && supabase && (
          <button
            className="auth-sign-out"
            type="button"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        )}
        {authError && <span className="auth-error-banner" role="alert">{authError}</span>}
      </footer>
    </>
  );
}
