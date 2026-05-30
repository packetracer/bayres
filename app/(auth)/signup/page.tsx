import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createSession, getSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createUser } from "@/lib/users";
import { userRegistrationSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect("/");
  const params = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const parsed = userRegistrationSchema.omit({ role: true }).safeParse(Object.fromEntries(formData));
    if (!parsed.success) redirect("/signup?error=invalid");
    try {
      const user = await createUser({ ...parsed.data, role: "viewer" });
      await recordAuditEvent({
        action: "user.self_registered",
        targetType: "user",
        targetId: user.id,
        summary: `${user.name} signed up as a guest`
      });
      await createSession({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        redirect("/signup?error=exists");
      }
      throw error;
    }
    redirect("/calendar");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bay-50 px-4 py-8">
      <form action={signup} className="card grid w-full max-w-md gap-4">
        <div className="grid justify-items-center gap-3 text-center">
          <Image src="/thebay.png" alt="The Bay" width={220} height={220} priority className="h-auto w-44 sm:w-56" />
          <div>
            <h1 className="text-2xl font-bold text-bay-900">Guest sign up</h1>
            <p className="text-sm text-slate-500">Create a family guest account to request Bay House dates.</p>
          </div>
        </div>
        {params.error === "invalid" ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">Enter a name, valid email, and password with at least 8 characters.</p> : null}
        {params.error === "exists" ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">That email already has an account. Sign in instead.</p> : null}
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Email
          <input name="email" type="email" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Password
          <input name="password" type="password" minLength={8} required />
        </label>
        <button className="button-primary" type="submit">Create guest account</button>
        <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          Already have an account? <Link className="font-semibold text-bay-600" href="/login">Sign in</Link>
        </div>
      </form>
    </main>
  );
}
