import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createExistingChild } from '@/lib/admin/children-actions';
import { listAgeGroupEntries } from '@/lib/content/lookup';
import { readContent } from '@/lib/content/store';
import StaffEnrollmentFields, { listGroupOptions } from '@/components/admin/StaffEnrollmentFields';
import PastClassesFields from '@/components/admin/PastClassesFields';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

export default async function NewExistingChildPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const [ageGroups, groups] = await Promise.all([listAgeGroupEntries(), listGroupOptions()]);
  const courseSuggestions = [...new Set(readContent().courses.map((c) => c.title.en))];

  return (
    <div className="max-w-3xl">
      <Link href="/admin/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Children
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Add an existing child</h1>
      <p className="mt-1 text-sm text-stone">
        For children already enrolled on paper. A code is generated for the child: give it to the parent and they link the child to
        their account by typing it in the parent portal.
      </p>

      {searchParams.error ? (
        <p className="mt-4 text-sm font-semibold text-red-600">Please fill in the name, date of birth and age group.</p>
      ) : null}

      <form action={createExistingChild} className="mt-6 space-y-6">
        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">Child</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Full name</span>
              <input name="fullName" required className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Date of birth</span>
              <input name="dateOfBirth" type="date" required className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Age group</span>
              <select name="ageGroupSlug" required defaultValue="" className={inputClassName}>
                <option value="">Select an age group</option>
                {ageGroups.map((g) => (
                  <option key={g.slug} value={g.slug}>
                    {g.label.en}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClassName}>School (optional)</span>
              <input name="institution" className={inputClassName} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClassName}>Special accommodations (optional)</span>
              <input name="specialNeeds" className={inputClassName} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">This year</h2>
          <p className="mt-1 text-sm text-stone">
            The group they attend now. The group must be for the age group picked above. You can add more groups from the child&apos;s
            page afterwards.
          </p>
          <div className="mt-4">
            <StaffEnrollmentFields groups={groups} optional />
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">Previous years (optional)</h2>
          <p className="mt-1 text-sm text-stone">Classes the child took before this year, from the paper records.</p>
          <PastClassesFields courseSuggestions={courseSuggestions} />
        </section>

        <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
          Create child and generate code
        </PendingSubmitButton>
      </form>
    </div>
  );
}
