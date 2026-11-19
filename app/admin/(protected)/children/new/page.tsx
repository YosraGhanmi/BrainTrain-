import Link from 'next/link';
import { ArrowLeft, Baby, CalendarClock, History, KeyRound, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { createExistingChild } from '@/lib/admin/children-actions';
import { readContent } from '@/lib/content/store';
import { adminAgeGroupOptions, loadStaffEnrollmentOptions } from '@/lib/admin/staff-enrollment';
import { listDbChildPickerOptions } from '@/lib/db/children';
import StaffEnrollmentFields from '@/components/admin/StaffEnrollmentFields';
import AdminAgeGroupFields from '@/components/admin/AdminAgeGroupFields';
import DuplicateChildWarning from '@/components/admin/DuplicateChildWarning';
import FamilyFields from '@/components/admin/FamilyFields';
import ChildPicker from '@/components/admin/ChildPicker';
import PastClassesFields from '@/components/admin/PastClassesFields';
import FormSteps from '@/components/admin/FormSteps';
import { CHILD_MAX_AGE, CHILD_MIN_AGE, NAME_MAX_LENGTH } from '@/lib/children/validation';

export const dynamic = 'force-dynamic';

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

const FORM_ERRORS: Record<string, string> = {
  registeredAt: 'Please fill in the registration date.',
  nameLength: `The child's name can be at most ${NAME_MAX_LENGTH} characters.`,
  parentNameLength: `Parents' names can be at most ${NAME_MAX_LENGTH} characters.`,
  age: `The date of birth must make the child between ${CHILD_MIN_AGE} and ${CHILD_MAX_AGE} years old.`,
};

export default async function NewExistingChildPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await requireAdmin();
  // The Admin imports existing children, often with no known registration
  // date; the front desk registers new arrivals, so the date is required
  const dateRequired = session.kind === 'secretary';
  const today = new Date().toISOString().slice(0, 10);
  const [enrollmentOptions, content, ageGroups, siblingOptions] = await Promise.all([
    loadStaffEnrollmentOptions(),
    readContent(),
    adminAgeGroupOptions(),
    listDbChildPickerOptions(),
  ]);
  const courseSuggestions = [...new Set(content.courses.map((c) => c.title.en))];

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
          {FORM_ERRORS[searchParams.error] ?? "Please fill in the child's name."}
        </p>
      ) : null}

      <FormSteps
        action={createExistingChild}
        submitLabel="Create child and generate code"
        steps={[
          {
            title: 'Child',
            description: 'Who the child is. Only the name is required: the rest can be completed later.',
            icon: <Baby />,
            content: (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Full name</span>
                  <input name="fullName" required autoFocus maxLength={NAME_MAX_LENGTH} className={inputClassName} />
                </label>
                <AdminAgeGroupFields groups={ageGroups} labelClassName={labelClassName} inputClassName={inputClassName} />
                <DuplicateChildWarning className="sm:col-span-2 empty:hidden" />
                <label className="block">
                  <span className={labelClassName}>School (optional)</span>
                  <input name="institution" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>{dateRequired ? 'Registration date' : 'Registration date (optional)'}</span>
                  <input
                    name="registeredAt"
                    type="date"
                    required={dateRequired}
                    defaultValue={dateRequired ? today : undefined}
                    className={inputClassName}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Special accommodations (optional)</span>
                  <input name="specialNeeds" className={inputClassName} />
                </label>
              </div>
            ),
          },
          {
            title: 'Parents',
            description: 'From the paper records. Shown in the children list until the parent links the child.',
            icon: <Users />,
            optional: true,
            content: (
              <div className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className={labelClassName}>Brother or sister of (optional)</span>
                  <ChildPicker name="siblingId" options={siblingOptions} inputClassName={`${inputClassName} bg-white`} />
                  <p className="mt-1.5 text-xs text-stone">
                    The child joins that family: same parents, and one parent code links them all. Anything typed below fills in what the
                    family is missing.
                  </p>
                </div>
                <FamilyFields labelClassName={labelClassName} inputClassName={inputClassName} />
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
