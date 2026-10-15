import Link from 'next/link';
import { ArrowLeft, Baby, CalendarClock, History, KeyRound, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createExistingChild } from '@/lib/admin/children-actions';
import { readContent } from '@/lib/content/store';
import { ADMIN_BIRTH_DATE_LABELS, adminAgeGroupOptions, loadStaffEnrollmentOptions } from '@/lib/admin/staff-enrollment';
import StaffEnrollmentFields from '@/components/admin/StaffEnrollmentFields';
import BirthDateAgeGroupFields from '@/components/portal/BirthDateAgeGroupFields';
import PastClassesFields from '@/components/admin/PastClassesFields';
import FormSteps from '@/components/admin/FormSteps';

export const dynamic = 'force-dynamic';

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

export default async function NewExistingChildPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  await requireAdmin();
  const enrollmentOptions = await loadStaffEnrollmentOptions();
  const courseSuggestions = [...new Set((await readContent()).courses.map((c) => c.title.en))];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Children
      </Link>

      <div className="mt-2 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">Add an existing child</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-stone">
          For children already enrolled on paper. At the end you get a{' '}
          <span className="inline-flex items-center gap-1 font-semibold text-ink">
            <KeyRound className="h-3.5 w-3.5 text-accent" />
            parent code
          </span>{' '}
          to hand to the parent, so they can link the child to their account.
        </p>
      </div>

      {searchParams.error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
          Please fill in the name and date of birth (and the age group if none was detected).
        </p>
      ) : null}

      <FormSteps
        action={createExistingChild}
        submitLabel="Create child and generate code"
        steps={[
          {
            title: 'Child',
            description: 'Who the child is.',
            icon: <Baby />,
            content: (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClassName}>Full name</span>
                  <input name="fullName" required autoFocus className={inputClassName} />
                </label>
                <BirthDateAgeGroupFields
                  groups={await adminAgeGroupOptions()}
                  labels={ADMIN_BIRTH_DATE_LABELS}
                  labelClassName={labelClassName}
                  inputClassName={inputClassName}
                />
                <label className="block">
                  <span className={labelClassName}>School (optional)</span>
                  <input name="institution" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Registration date</span>
                  <input name="registeredAt" type="date" defaultValue={today} className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Special accommodations (optional)</span>
                  <input name="specialNeeds" className={inputClassName} />
                </label>
              </div>
            ),
          },
          {
            title: 'Parent',
            description: 'From the paper records. Shown in the children list until the parent links the child.',
            icon: <Users />,
            optional: true,
            content: (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Full name</span>
                  <input name="contactName" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Phone</span>
                  <input name="contactPhone" type="tel" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Email</span>
                  <input name="contactEmail" type="email" className={inputClassName} />
                </label>
              </div>
            ),
          },
          {
            title: 'This year',
            description: "The course and time slot they attend now. Skip it to enroll later; more can be added from the child's page.",
            icon: <CalendarClock />,
            optional: true,
            content: <StaffEnrollmentFields options={enrollmentOptions} optional />,
          },
          {
            title: 'Past years',
            description: 'Classes the child took before this year, from the paper records.',
            icon: <History />,
            optional: true,
            content: <PastClassesFields courseSuggestions={courseSuggestions} />,
          },
        ]}
      />
    </div>
  );
}
