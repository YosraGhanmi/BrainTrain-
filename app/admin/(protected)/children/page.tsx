import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteChild } from '@/lib/admin/portal-actions';
import { getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import DeleteIconButton from '@/components/admin/DeleteIconButton';

export const dynamic = 'force-dynamic';

export default async function AdminChildrenPage() {
  requireAdmin();
  const children = await prisma.child.findMany({
    include: { parent: { include: { user: true } }, enrollments: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Children</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th className="px-5 py-3">Child</th>
              <th className="px-5 py-3">Age group</th>
              <th className="px-5 py-3">Parent</th>
              <th className="px-5 py-3">Enrollments</th>
              <th className="px-5 py-3">Special accommodations</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {children.map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-4 font-semibold text-ink">{c.fullName}</td>
                <td className="px-5 py-4 text-stone">{getAgeGroupEntryOrThrow(c.ageGroupSlug).label.en}</td>
                <td className="px-5 py-4 text-stone">{c.parent.user.fullName}</td>
                <td className="px-5 py-4 text-stone">{c.enrollments.length}</td>
                <td className="px-5 py-4 text-stone">{c.specialNeeds ?? '—'}</td>
                <td className="px-5 py-4 text-right">
                  <DeleteIconButton action={deleteChild.bind(null, c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
