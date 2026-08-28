import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { createTeacher, deleteTeacher } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default async function AdminTeachersPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  requireAdmin();
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    include: { teacher: { include: { sessions: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Teachers</h1>

      {searchParams.error === 'exists' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">A user with that email or phone already exists.</p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in every field (password: 8+ characters).</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <form action={createTeacher} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <input name="fullName" placeholder="Full name" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="email" type="email" placeholder="Email" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="phone" type="tel" placeholder="Phone" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="password" type="password" placeholder="Temporary password" required minLength={8} className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2 lg:col-span-4">
          Create teacher account
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Sessions</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">{t.fullName}</td>
                <td className="px-5 py-4 text-stone">{t.email}</td>
                <td className="px-5 py-4 text-stone">{t.phone}</td>
                <td className="px-5 py-4 text-stone">{t.teacher?.sessions.length ?? 0}</td>
                <td className="px-5 py-4 text-right">
                  <DeleteIconButton action={deleteTeacher.bind(null, t.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
