import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionRole } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import "../shell.css";

// Guard: /app ist ausschließlich für Staff (die zwei Gründer).
// Mandanten werden ins Portal umgeleitet, Nicht-Zugeordnete zum Login.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSessionRole();
  if (!user) redirect("/login");
  if (role === "client") redirect("/portal");
  if (role !== "staff") redirect("/login");

  return (
    <div className="shell">
      <header className="shell-top">
        <div className="shell-top-inner">
          <Link href="/app" className="shell-brand">
            <span className="wm">
              VALE<span>O</span>
            </span>
            <span className="area">Team-Cockpit</span>
          </Link>
          <div className="shell-user">
            <span className="who">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="shell-logout">
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
