import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { createSecretary, deleteSecretary, setSecretaryFrozen } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import FreezeToggleButton from '@/components/admin/FreezeToggleButton';

export const dynamic = 'force-dynamic';

export default async function AdminSecretariesPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  await requireAdmin();
  const secretaries = await prisma.user.findMany({
    where: { role: 'SECRETARY' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Secretaries</h1>
      <p className="mt-1 text-sm text-stone">Secretary accounts sign in through the same door as Admin, with a role picker.</p>

      {searchParams.error === 'exists' ? (
        <p className="mt-4 text-sm font-semibold text-red-600">A user with that email or phone already exists.</p>
      ) : searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in every field (password: 8+ characters).</p>
      ) : searchParams.saved ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <form action={createSecretary} className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <input name="fullName" placeholder="Full name" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="email" type="email" placeholder="Email" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="phone" type="tel" placeholder="Phone" required className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <input name="password" type="password" placeholder="Temporary password" required minLength={8} className="rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 outline-none focus:border-accent" />
        <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent sm:col-span-2 lg:col-span-4">
          Create secretary account
        </button>
      </form>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {secretaries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-6 text-center text-stone">
                  No secretary account yet.
                </td>
              </tr>
            ) : (
              secretaries.map((s) => (
                <tr key={s.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">
                    <div className="flex items-center gap-2">
                      {s.fullName}
                      {s.isFrozen ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Frozen
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-stone">{s.email}</td>
                  <td className="px-5 py-4 text-stone">{s.phone}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <FreezeToggleButton action={setSecretaryFrozen.bind(null, s.id, !s.isFrozen)} isFrozen={s.isFrozen} />
                      <DeleteIconButton action={deleteSecretary.bind(null, s.id)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
