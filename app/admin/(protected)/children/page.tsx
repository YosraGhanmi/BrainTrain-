import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteChild } from '@/lib/admin/portal-actions';
import { getAgeGroupEntryOrThrow } from '@/lib/content/lookup';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import { formatClaimCode, listAllFirebaseChildren } from '@/lib/firebase/children';

export const dynamic = 'force-dynamic';

export default async function AdminChildrenPage() {
  await requireAdmin();
  const children = await listAllFirebaseChildren();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Children</h1>
        <Link
          href="/admin/children/new"
          className="flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
        >
          <UserPlus className="h-4 w-4" />
          Add existing child
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-left text-sm">
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
                <td className="px-5 py-4 font-semibold text-ink">
                  <Link href={`/admin/children/${c.id}`} className="transition hover:text-accent hover:underline">
                    {c.fullName}
                  </Link>
                </td>
                <td className="px-5 py-4 text-stone">{getAgeGroupEntryOrThrow(c.ageGroupSlug).label.en}</td>
                <td className="px-5 py-4 text-stone">
                  {c.parentId ? (
                    c.parentName
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Not linked</span>
                      {c.claimCode ? <span className="font-mono text-xs font-bold text-ink">{formatClaimCode(c.claimCode)}</span> : null}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-stone">{c.enrollmentCount}</td>
                <td className="px-5 py-4 text-stone">{c.specialNeeds ?? '-'}</td>
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
