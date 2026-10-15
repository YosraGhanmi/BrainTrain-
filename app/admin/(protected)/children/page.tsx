import Link from 'next/link';
import { KeyRound, Link2, Pencil, UserPlus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteChild } from '@/lib/admin/portal-actions';
import { ageOn } from '@/lib/content/age-range';
import ClickableRow from '@/components/admin/ClickableRow';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import { formatClaimCode, listAllDbChildren } from '@/lib/db/children';

export const dynamic = 'force-dynamic';

// Dates of birth are stored as UTC midnight, so they're read back in UTC to
// avoid shifting a day in either direction.

const pad = (n: number) => String(n).padStart(2, '0');

const th = 'border border-ink/10 px-3 py-2 align-bottom';
const td = 'border border-ink/10 px-3 py-2.5';

export default async function AdminChildrenPage() {
  await requireAdmin();
  const children = await listAllDbChildren();
  const today = new Date();

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
        <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
          <thead className="text-xs font-bold uppercase tracking-wide text-stone">
            <tr>
              <th rowSpan={2} className={`${th} bg-orange-50 text-center`}>
                #
              </th>
              <th rowSpan={2} className={th}>
                Full name
              </th>
              <th colSpan={4} className={`${th} text-center`}>
                Birthday
              </th>
              <th rowSpan={2} className={th}>
                School
              </th>
              <th rowSpan={2} className={th}>
                Parent
              </th>
              <th rowSpan={2} className={th}>
                Phone
              </th>
              <th rowSpan={2} className={`${th} bg-orange-50`}>
                Registration date
              </th>
              <th rowSpan={2} className={th}>
                Email
              </th>
              <th rowSpan={2} className={th} />
            </tr>
            <tr>
              <th className={`${th} text-center`}>Day</th>
              <th className={`${th} text-center`}>Month</th>
              <th className={`${th} text-center`}>Year</th>
              <th className={`${th} bg-amber-50 text-center`}>Age</th>
            </tr>
          </thead>
          <tbody>
            {children.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-5 py-6 text-center text-stone">
                  No children yet.
                </td>
              </tr>
            ) : (
              children.map((c, i) => {
                const dob = c.dateOfBirth;
                const hasDob = !Number.isNaN(dob.getTime()) && dob.getTime() > 0;
                return (
                  <ClickableRow key={c.id} href={`/admin/children/${c.id}`} className="transition hover:bg-accent/5">
                    <td className={`${td} bg-orange-50/60 text-center font-semibold text-ink`}>{i + 1}</td>
                    <td className={`${td} font-semibold text-ink`}>
                      <Link href={`/admin/children/${c.id}`} className="transition hover:text-accent hover:underline">
                        {c.fullName}
                      </Link>
                    </td>
                    <td className={`${td} text-center text-stone`}>{hasDob ? pad(dob.getUTCDate()) : '-'}</td>
                    <td className={`${td} text-center text-stone`}>{hasDob ? pad(dob.getUTCMonth() + 1) : '-'}</td>
                    <td className={`${td} text-center text-stone`}>{hasDob ? dob.getUTCFullYear() : '-'}</td>
                    <td className={`${td} bg-amber-50/60 text-center font-semibold text-ink`}>{hasDob ? ageOn(dob, today) : '-'}</td>
                    <td className={`${td} text-stone`}>{c.institution ?? '-'}</td>
                    <td className={`${td} text-stone`}>
                      {c.parentId ? (
                        // Opens the Parents page with this parent's row glowing
                        <Link
                          href={`/admin/parents?highlight=${c.parentId}#parent-${c.parentId}`}
                          title="Show in Parents"
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <Link2 className="h-3.5 w-3.5 shrink-0" />
                          {c.parentName || 'Parent account'}
                        </Link>
                      ) : c.claimCode ? (
                        // Not linked yet: the code to hand to the parent says it all
                        <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-wider text-ink" title="Parent code">
                          <KeyRound className="h-4 w-4 text-accent" />
                          {formatClaimCode(c.claimCode)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-stone`}>{c.parentPhone || '-'}</td>
                    <td className={`${td} bg-orange-50/60 whitespace-nowrap text-stone`}>
                      {(c.registeredAt ?? c.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className={`${td} text-stone`}>{c.parentEmail || '-'}</td>
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/children/${c.id}/edit`}
                          aria-label={`Edit ${c.fullName}`}
                          className="flex items-center justify-center rounded-lg border border-ink/10 p-1.5 text-ink/70 transition hover:bg-slate-100 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteIconButton action={deleteChild.bind(null, c.id)} />
                      </div>
                    </td>
                  </ClickableRow>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
