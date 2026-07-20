import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import LoginView from "./login-view";

// Server-seitige Rollen-Weiche: wer schon eingeloggt ist, landet direkt
// im richtigen Bereich. Sonst wird das Login-Formular gezeigt.
export default async function LoginPage() {
  const { role } = await getSessionRole();
  if (role === "staff") redirect("/app");
  if (role === "client") redirect("/portal");
  return <LoginView />;
}
