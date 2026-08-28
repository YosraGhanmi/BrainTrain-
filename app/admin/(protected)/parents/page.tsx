import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteParent } from '@/lib/admin/portal-actions';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default async function AdminParentsPage() {
  requireAdmin();
  const parents = await prisma.user.findMany({
    where: { role: 'PARENT' },
    include: { parent: { include: { children: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Parents</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Children</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {parents.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">{p.fullName}</td>
                <td className="px-5 py-4 text-stone">{p.email}</td>
                <td className="px-5 py-4 text-stone">{p.phone}</td>
                <td className="px-5 py-4 text-stone">{p.parent?.children.length ?? 0}</td>
                <td className="px-5 py-4 text-right">
                  <DeleteIconButton action={deleteParent.bind(null, p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
