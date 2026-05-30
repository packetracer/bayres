import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveUserAction, approveUserAndRequestsAction, createUserAction, setUserRoleAction } from "../actions";

export default async function UsersPage() {
  const admin = await requireAdmin();
  const users = await prisma.user.findMany({
    include: {
      reservations: {
        where: { status: "pending" },
        orderBy: { reservationStart: "asc" }
      }
    },
    orderBy: [{ approvedAt: "asc" }, { role: "asc" }, { name: "asc" }]
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Family users</h1>
        <p className="text-sm text-slate-500">Approve family guest accounts, register users, and promote trusted users to admins.</p>
      </div>

      <form action={createUserAction} className="card grid gap-4">
        <h2 className="font-semibold">Register a user</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">
            Name
            <input name="name" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Email
            <input name="email" type="email" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Temporary password
            <input name="password" type="password" minLength={8} required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Role
            <select name="role" defaultValue="viewer">
              <option value="viewer">Registered user</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <div>
          <button className="button-primary" type="submit">Create user</button>
        </div>
      </form>

      <section className="card overflow-x-auto p-0">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Account</th>
              <th className="p-3">Pending requests</th>
              <th className="p-3">Created</th>
              <th className="p-3">Admin action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-3 font-semibold">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role === "admin" ? "Admin" : "Registered user"}</td>
                <td className="p-3">
                  {user.approvedAt ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Approved</span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Pending approval</span>
                  )}
                </td>
                <td className="p-3">
                  {user.reservations.length ? (
                    <div className="grid gap-1">
                      {user.reservations.map((reservation) => (
                        <span key={reservation.id}>{format(reservation.reservationStart, "PP")} · {reservation.partySize} guests</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </td>
                <td className="p-3">{format(user.createdAt, "PP")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {!user.approvedAt ? (
                      user.reservations.length ? (
                        <form action={approveUserAndRequestsAction.bind(null, user.id)}>
                          <button className="button-primary" type="submit">Approve account and requests</button>
                        </form>
                      ) : (
                        <form action={approveUserAction.bind(null, user.id)}>
                          <button className="button-primary" type="submit">Approve account</button>
                        </form>
                      )
                    ) : null}
                  {user.role === "admin" ? (
                    user.id === admin.userId ? (
                      <span className="text-slate-500">Current admin</span>
                    ) : (
                      <form action={setUserRoleAction.bind(null, user.id, "viewer")}>
                        <button type="submit">Demote</button>
                      </form>
                    )
                  ) : (
                    <form action={setUserRoleAction.bind(null, user.id, "admin")}>
                      <button className="button-primary" type="submit">Promote to admin</button>
                    </form>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
