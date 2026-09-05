import { Check, X } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteParent, setParentFrozen, approveParent, rejectParent } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import FreezeToggleButton from '@/components/admin/FreezeToggleButton';

export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

export default async function AdminParentsPage({ searchParams }: { searchParams: { saved?: string } }) {
  await requireAdmin();
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
    include: { parent: { include: { children: true } } },
    // Pending accounts surface first so they don't get lost under approved ones.
    orderBy: [{ parent: { status: 'asc' } }, { createdAt: 'desc' }],
  });

  const pendingCount = parents.filter((p) => p.parent?.status === 'PENDING').length;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Parents</h1>

      {pendingCount > 0 ? (
        <p className="mt-2 text-sm font-semibold text-amber-700">
          {pendingCount} account{pendingCount === 1 ? '' : 's'} awaiting approval.
        </p>
      ) : searchParams.saved ? (
        <p className="mt-2 text-sm font-semibold text-emerald-600">Saved.</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Children</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => {
              const status = p.parent?.status ?? 'APPROVED';
              return (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-4 font-semibold text-ink">
                    <div className="flex items-center gap-2">
                      {p.fullName}
                      {p.isFrozen ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                          Frozen
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-stone">{p.email}</td>
                  <td className="px-5 py-4 text-stone">{p.phone}</td>
                  <td className="px-5 py-4 text-stone">{p.parent?.children.length ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_BADGE[status]}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {status === 'PENDING' ? (
                        <>
                          <form action={approveParent.bind(null, p.id)}>
                            <button
                              type="submit"
                              aria-label="Accept"
                              title="Accept"
                              className="flex items-center justify-center rounded-lg border border-emerald-200 p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </form>
                          <form action={rejectParent.bind(null, p.id)}>
                            <button
                              type="submit"
                              aria-label="Reject"
                              title="Reject"
                              className="flex items-center justify-center rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </form>
                        </>
                      ) : (
                        <FreezeToggleButton action={setParentFrozen.bind(null, p.id, !p.isFrozen)} isFrozen={p.isFrozen} />
                      )}
                      <DeleteIconButton action={deleteParent.bind(null, p.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
