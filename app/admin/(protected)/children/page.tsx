import Link from 'next/link';
import { FileDown, FileUp, KeyRound, Link2, Pencil, TriangleAlert, UserPlus } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { deleteChild } from '@/lib/admin/portal-actions';
import { ageOn } from '@/lib/content/age-range';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { filterChildren, filtersToQuery, listSchools, missingDetails, missingDetailsText, parseChildrenFilters, schoolKey } from '@/lib/children/list';
import ClickableRow from '@/components/admin/ClickableRow';
import ChildrenFilters from '@/components/admin/ChildrenFilters';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import { formatClaimCode, listAllDbChildren, registrationDate } from '@/lib/db/children';

export const dynamic = 'force-dynamic';

// Dates of birth are stored as UTC midnight, so they're read back in UTC to
// avoid shifting a day in either direction.

const pad = (n: number) => String(n).padStart(2, '0');

const th = 'border border-ink/10 px-3 py-2 align-bottom';
const td = 'border border-ink/10 px-3 py-2.5';
const toolButton =
  'group flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-inset transition focus-visible:outline-none focus-visible:ring-2';

export default async function AdminChildrenPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireAdmin();
  const isAdmin = session.kind === 'admin';
  const filters = parseChildrenFilters(await props.searchParams);
  const [all, ageGroups] = await Promise.all([listAllDbChildren(), listAgeGroupEntries()]);
  const children = filterChildren(all, filters);
  const groupLabel = new Map(ageGroups.map((g) => [g.slug, g.label.en]));
  const query = filtersToQuery(filters);
  const today = new Date();
  const countBy = <K extends string>(key: (c: (typeof all)[number]) => K) =>
    all.reduce((m, c) => m.set(key(c), (m.get(key(c)) ?? 0) + 1), new Map<K, number>());
  const perGroup = countBy((c) => c.ageGroupSlug);
  const perSchool = countBy((c) => schoolKey(c.institution));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Children</h1>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <Link href="/admin/children/import" className={`${toolButton} bg-white text-accent ring-accent/25 hover:bg-accent/5 focus-visible:ring-accent/50`}>
                <FileUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                Import Excel
              </Link>
              {/* A plain link: the file downloads instead of navigating */}
              <a
                href={`/admin/children/export${query ? `?${query}` : ''}`}
                download
                title={query ? 'Exports the children shown with these filters' : 'Exports every child'}
                className={`${toolButton} bg-emerald-600 text-white ring-emerald-600 shadow-[0_8px_20px_-8px_rgba(5,150,105,0.6)] hover:bg-emerald-700 focus-visible:ring-emerald-300`}
              >
                <FileDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                Export Excel
              </a>
              <span aria-hidden className="mx-1 hidden h-6 w-px bg-ink/10 sm:block" />
            </>
          ) : null}
          <Link
            href="/admin/children/new"
            className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
          >
            <UserPlus className="h-4 w-4" />
            Add existing child
          </Link>
        </div>
      </div>

      <div className="mt-5">
        <ChildrenFilters
          filters={filters}
          ageGroups={[
            ...ageGroups.map((g) => ({ value: g.slug, label: g.label.en, count: perGroup.get(g.slug) ?? 0 })),
            { value: 'none', label: 'No age group yet', count: perGroup.get('') ?? 0 },
          ]}
          schools={listSchools(all).map((s) => ({ value: s.key, label: s.label, count: perSchool.get(s.key) ?? 0 }))}
          counts={{
            noCourse: all.filter((c) => c.enrollmentCount === 0).length,
            overdue: all.filter((c) => c.hasOverduePayment).length,
            incomplete: all.filter((c) => missingDetails(c).length > 0).length,
          }}
          shown={children.length}
          total={all.length}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-soft">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
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
                Age group
              </th>
              <th rowSpan={2} className={th}>
                School
              </th>
              <th rowSpan={2} className={th}>
                Parents
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
                <td colSpan={13} className="px-5 py-6 text-center text-stone">
                  {all.length === 0 ? 'No children yet.' : 'No child matches these filters.'}
                </td>
              </tr>
            ) : (
              children.map((c, i) => {
                const dob = c.dateOfBirth;
                const missing = missingDetails(c);
                return (
                  <ClickableRow key={c.id} href={`/admin/children/${c.id}`} className="transition hover:bg-accent/5">
                    <td className={`${td} bg-orange-50/60 text-center font-semibold text-ink`}>{i + 1}</td>
                    <td className={`${td} font-semibold text-ink`}>
                      <Link href={`/admin/children/${c.id}`} className="transition hover:text-accent hover:underline">
                        {c.fullName}
                      </Link>
                      {missing.length > 0 ? (
                        <span
                          title={missingDetailsText(missing)}
                          className="ml-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide text-amber-800"
                        >
                          <TriangleAlert className="h-3 w-3" />
                          To complete
                          <span className="sr-only">: {missingDetailsText(missing)}</span>
                        </span>
                      ) : null}
                    </td>
                    <td className={`${td} text-center text-stone`}>{dob ? pad(dob.getUTCDate()) : '-'}</td>
                    <td className={`${td} text-center text-stone`}>{dob ? pad(dob.getUTCMonth() + 1) : '-'}</td>
                    <td className={`${td} text-center text-stone`}>{dob ? dob.getUTCFullYear() : '-'}</td>
                    <td className={`${td} bg-amber-50/60 text-center font-semibold text-ink`}>{dob ? ageOn(dob, today) : '-'}</td>
                    <td className={`${td} whitespace-nowrap text-stone`}>
                      {c.ageGroupSlug ? (
                        <span title={c.ageGroupManual ? 'Picked by hand' : undefined}>
                          {groupLabel.get(c.ageGroupSlug) ?? c.ageGroupSlug}
                          {c.ageGroupManual ? '*' : ''}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`${td} text-stone`}>{c.institution ?? '-'}</td>
                    <td className={`${td} text-stone`}>
                      <div className="flex flex-col items-start gap-1">
                        {c.account ? (
                          // Opens the Parents page with this parent's row glowing
                          <Link
                            href={`/admin/parents?highlight=${c.parentId}#parent-${c.parentId}`}
                            title="Show in Parents"
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <Link2 className="h-3.5 w-3.5 shrink-0" />
                            {c.account.fullName || 'Parent account'}
                          </Link>
                        ) : null}
                        {c.parentNames
                          .filter((n) => n !== c.account?.fullName)
                          .map((n) => (
                            <span key={n}>{n}</span>
                          ))}
                        {!c.parentId && c.claimCode ? (
                          // Not linked yet: the code to hand to the parent
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-wider text-ink" title="Parent code">
                            <KeyRound className="h-3.5 w-3.5 text-accent" />
                            {formatClaimCode(c.claimCode)}
                          </span>
                        ) : null}
                        {!c.account && c.parentNames.length === 0 && !c.claimCode ? '-' : null}
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-stone`}>
                      {c.phones.length > 0 ? c.phones.map((p) => <div key={p}>{p}</div>) : '-'}
                    </td>
                    <td className={`${td} bg-orange-50/60 whitespace-nowrap text-stone`}>
                      {registrationDate(c)?.toLocaleDateString('fr-FR') ?? 'Not set'}
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
      {children.some((c) => c.ageGroupManual) ? (
        <p className="mt-2 text-xs text-stone">* Age group picked by hand.</p>
      ) : null}
    </div>
  );
}
