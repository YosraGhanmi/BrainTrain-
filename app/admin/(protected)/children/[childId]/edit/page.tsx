import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Baby, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { updateChildDetails } from '@/lib/admin/children-actions';
import { getDbChild } from '@/lib/db/children';
import { ADMIN_BIRTH_DATE_LABELS, adminAgeGroupOptions } from '@/lib/admin/staff-enrollment';
import BirthDateAgeGroupFields from '@/components/portal/BirthDateAgeGroupFields';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

// yyyy-mm-dd for <input type="date">
function toDateInput(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-ink/5 bg-gradient-to-r from-accent/10 via-accent2/5 to-transparent px-6 py-4 sm:px-8">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-sm [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <p className="text-sm text-stone">{description}</p>
      </div>
    </div>
  );
}

export default async function EditChildPage(props: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  await requireAdmin();

  const child = await getDbChild(params.childId);
  if (!child) notFound();
  const profileHref = `/admin/children/${child.id}`;

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <Link href={profileHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        {child.fullName}
      </Link>
      <h1 className="mt-2 text-center font-display text-3xl font-semibold text-ink">Edit {child.fullName}</h1>

      {searchParams.error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
          The name and date of birth are required.
        </p>
      ) : null}

      <form action={updateChildDetails.bind(null, child.id)} className="mt-6 space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_60px_-24px_rgba(30,41,90,0.35)]">
          <SectionHeader icon={<Baby />} title="Child" description="Who the child is." />
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 sm:px-8">
            <label className="block">
              <span className={labelClassName}>Full name</span>
              <input name="fullName" required defaultValue={child.fullName} className={inputClassName} />
            </label>
            <BirthDateAgeGroupFields
              groups={await adminAgeGroupOptions()}
              defaultDateOfBirth={toDateInput(child.dateOfBirth)}
              defaultAgeGroupSlug={child.ageGroupSlug}
              labels={ADMIN_BIRTH_DATE_LABELS}
              labelClassName={labelClassName}
              inputClassName={inputClassName}
            />
            <label className="block">
              <span className={labelClassName}>School</span>
              <input name="institution" defaultValue={child.institution ?? ''} className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Registration date</span>
              <input name="registeredAt" type="date" defaultValue={toDateInput(child.registeredAt ?? child.createdAt)} className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Special accommodations</span>
              <input name="specialNeeds" defaultValue={child.specialNeeds ?? ''} className={inputClassName} />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_60px_-24px_rgba(30,41,90,0.35)]">
          <SectionHeader
            icon={<Users />}
            title="Parent contact"
            description={
              child.parentId
                ? "From the paper records. The linked parent account's own details are shown on the profile."
                : 'From the paper records. Shown until the parent links the child with the code.'
            }
          />
          <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 sm:px-8">
            <label className="block sm:col-span-2">
              <span className={labelClassName}>Full name</span>
              <input name="contactName" defaultValue={child.contactName ?? ''} className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Phone</span>
              <input name="contactPhone" type="tel" defaultValue={child.contactPhone ?? ''} className={inputClassName} />
            </label>
            <label className="block">
              <span className={labelClassName}>Email</span>
              <input name="contactEmail" type="email" defaultValue={child.contactEmail ?? ''} className={inputClassName} />
            </label>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={profileHref}
            className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
          >
            Cancel
          </Link>
          <PendingSubmitButton className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
            Save changes
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );
}
