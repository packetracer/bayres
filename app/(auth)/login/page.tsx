import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authenticate, createSession, getSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect("/");
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) redirect("/login?error=invalid");
    const user = await authenticate(parsed.data.email, parsed.data.password);
    if (!user) redirect("/login?error=invalid");
    await createSession({ id: user.id, email: user.email, role: user.role });
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bay-50 px-4 py-8">
      <form action={login} className="card grid w-full max-w-md gap-4">
        <div className="grid justify-items-center gap-3 text-center">
          <Image src="/thebay.png" alt="The Bay" width={220} height={220} priority className="h-auto w-44 sm:w-56" />
          <div>
            <h1 className="text-2xl font-bold text-bay-900">Bayhouse Reservations</h1>
            <p className="text-sm text-slate-500">Sign in or create a family guest account.</p>
          </div>
        </div>
        {params.error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">Invalid email or password.</p> : null}
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Password
          <input name="password" type="password" required />
        </label>
        <button className="button-primary" type="submit">Sign in</button>
        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          Need an account? <Link className="font-semibold text-bay-600" href="/signup">Sign up as a guest</Link>
        </div>
      </form>
    </main>
  );
}
