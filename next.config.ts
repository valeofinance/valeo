import type { NextConfig } from "next";

// Supabase-Projekt "valeo Datenbank Frankfurt" (eu-central-1).
// URL und Publishable Key sind öffentliche Werte (landen ohnehin im
// Browser-Bundle, Zugriffsschutz macht RLS); Env-Variablen in Vercel
// überschreiben die Fallbacks.
// Leerstring wie "nicht gesetzt" behandeln (|| statt ??), damit ein
// leeres Env-Feld in Vercel oder lokal auf den Fallback zurückfällt.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://pbfsxguutjcorczhibyu.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "sb_publishable_PY59Ct-7-44w6Hw7WYIDjA_IC6g7P3e",
  },
};

export default nextConfig;
