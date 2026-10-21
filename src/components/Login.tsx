import { useState, type FormEvent } from "react";
import { supabase } from "../integration/supabase";
import { CrochetHeart, FloralCluster, LilyDefs, PressedFlower, Sprig } from "./Lilies";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Add the project URL and anon key, then restart the app.");
      return;
    }

    setError("");
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError) setError(signInError.message);
  }

  return (
    <main className="login-page">
      <LilyDefs />
      <div className="login-garden" aria-hidden="true">
        <FloralCluster className="login-bloom login-bloom--tl" />
        <FloralCluster className="login-bloom login-bloom--tr" variant="b" />
        <FloralCluster className="login-bloom login-bloom--bl" variant="b" />
        <FloralCluster className="login-bloom login-bloom--br" />
        <PressedFlower className="login-pressed login-pressed--one" />
        <PressedFlower className="login-pressed login-pressed--two" />
        <PressedFlower className="login-pressed login-pressed--three" />
        <Sprig className="login-sprig login-sprig--one" />
        <Sprig className="login-sprig login-sprig--two" />
        <CrochetHeart className="login-heart login-heart--one" />
        <CrochetHeart className="login-heart login-heart--two" />
      </div>

      <section className="login-card" aria-label="Sign in">
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            autoComplete="username"
            id="login-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            autoComplete="current-password"
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? "Opening your corner…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
