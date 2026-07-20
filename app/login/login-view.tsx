"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import "./login.css";

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setError("Anmeldung fehlgeschlagen. E-Mail oder Passwort prüfen.");
      setLoading(false);
      return;
    }

    // Rolle bestimmen und in den passenden Bereich leiten:
    // Staff -> Team-Cockpit, sonst -> Kundenportal.
    const { data: staff } = await supabase
      .from("staff")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    router.push(staff ? "/app" : "/portal");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="name@agentur.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="submit" disabled={loading}>
        {loading ? "Anmelden …" : "Anmelden"}
      </button>
    </form>
  );
}

export default function LoginView() {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          VALE<span>O</span>
        </Link>
        <p className="auth-sub">Mandanten- &amp; Team-Zugang</p>

        <h1>Willkommen zurück</h1>
        <p className="auth-lead">
          Melde dich an, um dein Finanz-Cockpit zu öffnen.
        </p>

        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="auth-foot">
          Noch kein Zugang? <Link href="/#termin">Erstgespräch buchen</Link>
        </p>
      </div>
    </main>
  );
}
