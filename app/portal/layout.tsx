import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionRole } from "@/lib/auth";
import { signOut } from "@/lib/auth-actions";
import "../shell.css";

// Guard: /portal ist ausschließlich für Mandanten (client_users).
// Staff wird ins Team-Cockpit umgeleitet, Nicht-Zugeordnete zum Login.
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await getSessionRole();
  if (!user) redirect("/login");
  if (role === "staff") redirect("/app");
  if (role !== "client") redirect("/login");

  return (
    <div className="shell">
      <header className="shell-top">
        <div className="shell-top-inner">
          <Link href="/portal" className="shell-brand">
            <span className="wm">
              VALE<span>O</span>
            </span>
            <span className="area">Kundenportal</span>
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
