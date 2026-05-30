import Link from "next/link";
import { clearSession, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  async function logout() {
    "use server";
    await clearSession();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-bold text-bay-900">
              Bayhouse Reservations
            </Link>
            <p className="text-sm text-slate-500">{user.email} · {user.role}</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link className="button" href="/">Dashboard</Link>
            <Link className="button" href="/reservations">Reservations</Link>
            <Link className="button" href="/reservations/new">New</Link>
            <Link className="button" href="/emails">Email Activity</Link>
            <Link className="button" href="/review">Review Queue</Link>
            <form action={logout}>
              <button type="submit">Logout</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
