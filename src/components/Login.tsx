import { useState, type FormEvent } from "react";
import { supabase } from "../integration/supabase";
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
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-flower" aria-hidden="true">♡</span>
        <p className="login-kicker">a little place for us</p>
        <h1 id="login-title">Welcome <em>home</em></h1>
        <p className="login-copy">Sign in to open our little corner.</p>

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
