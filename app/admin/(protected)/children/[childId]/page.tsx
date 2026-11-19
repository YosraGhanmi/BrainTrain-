import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CalendarClock,
  CircleCheck,
  Clock,
  History,
  KeyRound,
  Link2,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
} from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import {
  addChildEnrollment,
  addPastClass,
  linkSibling,
  markChildPaymentPaid,
  regenerateChildClaimCode,
  removePastClass,
  unlinkSibling,
} from '@/lib/admin/children-actions';
import { ageGroupLookup, courseLookup, listAgeGroupEntries } from '@/lib/content/lookup';
import { ageGroupFit, ageOn } from '@/lib/content/age-range';
import { MISSING_DETAIL_LABELS, missingDetails, missingDetailsText } from '@/lib/children/list';
import { familyPhones, getDbFamily, listDbSiblings, PARENT_RELATION_LABELS, type DbFamily } from '@/lib/db/families';
import { rotateHue } from '@/lib/color';
import { formatClaimCode, getDbChild, listDbChildPickerOptions, registrationDate } from '@/lib/db/children';
import { getDbPortalProfile } from '@/lib/db/portal-auth';
import { listDbBadgesByChild } from '@/lib/db/badges';
import { listDbTeacherNotesByChild } from '@/lib/db/teacher-notes';
import { listDbCourseSessions } from '@/lib/db/sessions';
import { listDbTeachers } from '@/lib/db/teachers';
import { listDbEnrollmentsWithSessionsByChild, listDbPaymentsWithRelationsByChild } from '@/lib/db/read-models';
import { listTimeSlots, sessionGroupLabel } from '@/lib/scheduling/time-slots';
import { formatSessionDays } from '@/lib/scheduling/slots';
import { loadStaffEnrollmentOptions } from '@/lib/admin/staff-enrollment';
import StaffEnrollmentFields from '@/components/admin/StaffEnrollmentFields';
import DeleteIconButton from '@/components/admin/DeleteIconButton';
import RegenerateCodeButton from '@/components/admin/RegenerateCodeButton';
import ChildPicker from '@/components/admin/ChildPicker';
import InitialsAvatar from '@/components/portal/course/InitialsAvatar';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_GRADIENT = 'linear-gradient(to bottom right, #3d7fff, #6c5ce7, #ff8c42)';

const ERRORS: Record<string, string> = {
  enroll: 'Pick a course, a time slot, a plan and a payment method.',
  capacity: 'That group is full. Pick another time slot.',
  conflict: 'The child already has another class at that same day and time.',
  duplicate: 'The child is already in that group.',
  pastClass: 'Type the course name.',
  sibling: 'Pick another child to link as a brother or sister.',
  siblingAccounts: 'These children are linked to two different parent accounts, so they can\'t be put in one family here.',
};

// A payment as staff read it: paid, late, or still to come
type PaymentState = 'paid' | 'overdue' | 'upcoming' | 'failed';
const PAYMENT_STATE: Record<PaymentState, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  overdue: { label: 'Overdue', className: 'bg-red-50 text-red-700 ring-red-200' },
  upcoming: { label: 'Upcoming', className: 'bg-slate-50 text-slate-600 ring-slate-200' },
  failed: { label: 'Failed', className: 'bg-slate-100 text-slate-500 ring-slate-200' },
};
const PLAN_LABELS: Record<string, string> = { MONTHLY: 'Monthly', QUARTERLY: '3 months', YEARLY: 'Full year', SEASON: 'Full season' };
const METHOD_LABELS: Record<string, string> = { CASH: 'Cash', CHEQUE: 'Cheque', CARD: 'Card' };

// Late from the day after the due date: a payment due today isn't overdue yet
function paymentState(p: { status: string; dueDate: Date }, now: Date): PaymentState {
  if (p.status === 'PAID') return 'paid';
  if (p.status === 'FAILED') return 'failed';
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return p.status === 'OVERDUE' || p.dueDate.getTime() < startOfToday ? 'overdue' : 'upcoming';
}

const money = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';
const cardClassName = 'rounded-3xl border border-white/60 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(30,41,90,0.35)] sm:p-6';

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR');

function CardTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
      <span className="text-accent [&>svg]:h-[1.1rem] [&>svg]:w-[1.1rem]">{icon}</span>
      {children}
      {count ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-stone">{count}</span> : null}
    </h2>
  );
}

// A phone number or email that can be tapped to call or write
function ContactLink({ kind, value }: { kind: 'phone' | 'email'; value: string }) {
  const Icon = kind === 'phone' ? Phone : Mail;
  return (
    <a
      href={kind === 'phone' ? `tel:${value.replace(/[^\d+]/g, '')}` : `mailto:${value}`}
      title={value}
      className="group flex min-w-0 items-center gap-2 rounded-lg py-0.5 text-sm text-stone transition hover:text-accent"
    >
      <Icon className="h-4 w-4 shrink-0 text-accent/80 group-hover:text-accent" />
      <span className={`truncate ${kind === 'phone' ? 'tabular-nums' : ''}`}>{value}</span>
    </a>
  );
}

// One figure of the summary strip under the header
function Stat({ label, value, hint, tone = 'ink' }: { label: string; value: string; hint?: string; tone?: 'ink' | 'emerald' | 'amber' | 'red' }) {
  const color = { ink: 'text-ink', emerald: 'text-emerald-700', amber: 'text-amber-700', red: 'text-red-600' }[tone];
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-stone">{label}</p>
      <p className={`mt-1 truncate font-display text-xl font-semibold tabular-nums ${color}`}>{value}</p>
      {hint ? <p className="truncate text-xs text-stone">{hint}</p> : null}
    </div>
  );
}

// One parent from the paper records: relation, name, phones
function FamilyParent({ name, relation, phones }: { name: string | null; relation: string | null; phones: (string | null)[] }) {
  const numbers = phones.filter(Boolean);
  if (!name && numbers.length === 0) return null;
  return (
    <li className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">{relation ?? 'Parent'}</p>
      <p className="font-semibold text-ink">{name || 'Name not recorded'}</p>
      <div className="mt-1 space-y-0.5">
        {numbers.map((phone) => (
          <ContactLink key={phone} kind="phone" value={phone!} />
        ))}
      </div>
    </li>
  );
}

function FamilyParents({ family }: { family: DbFamily | null }) {
  if (!family) return null;
  const relation = (r: DbFamily['parent1Relation']) => (r ? PARENT_RELATION_LABELS[r] : null);
  return (
    <ul className="space-y-2">
      <FamilyParent name={family.parent1Name} relation={relation(family.parent1Relation)} phones={[family.parent1Phone, family.parent1Phone2]} />
      <FamilyParent name={family.parent2Name} relation={relation(family.parent2Relation)} phones={[family.parent2Phone, family.parent2Phone2]} />
      {family.email ? (
        <li className="px-1">
          <ContactLink kind="email" value={family.email} />
        </li>
      ) : null}
    </ul>
  );
}

export default async function AdminChildProfilePage(props: {
  params: Promise<{ childId: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const [courseOf, ageGroupOf] = await Promise.all([courseLookup(), ageGroupLookup()]);
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  await requireAdmin();

  const child = await getDbChild(params.childId);
  if (!child) notFound();
  const registeredOn = registrationDate(child);

  const [parent, family, siblings, siblingOptions, ageGroups, enrollments, payments, badges, notes, sessions, teachers, timeSlots, enrollmentOptions] = await Promise.all([
    getDbPortalProfile(child.parentId),
    getDbFamily(child.familyId),
    listDbSiblings(child),
    listDbChildPickerOptions(),
    listAgeGroupEntries(),
    listDbEnrollmentsWithSessionsByChild(child.id, ['PENDING', 'ACTIVE']),
    listDbPaymentsWithRelationsByChild(child.id),
    listDbBadgesByChild(child.id),
    listDbTeacherNotesByChild(child.id),
    listDbCourseSessions(),
    listDbTeachers(),
    listTimeSlots(),
    loadStaffEnrollmentOptions(),
  ]);

  const teacherName = new Map(teachers.map((t) => [t.id, t.fullName]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const courseTitleForSession = (sessionId: string | null) => {
    const session = sessionId ? sessionById.get(sessionId) : undefined;
    return session ? courseOf(session.courseSlug).title.en : null;
  };

  const ageGroup = ageGroupOf(child.ageGroupSlug);
  const age = child.dateOfBirth ? ageOn(child.dateOfBirth, new Date()) : null;
  // A group picked by hand that doesn't match the age: kept, but flagged
  const fit = child.ageGroupManual ? ageGroupFit(ageGroups.find((g) => g.slug === child.ageGroupSlug), child.dateOfBirth) : null;
  const parentNames = [parent?.fullName, family?.parent1Name, family?.parent2Name].filter((n): n is string => Boolean(n));
  const phones = [parent?.phone, parent?.secondaryPhone, ...familyPhones(family)].filter((p): p is string => Boolean(p));
  const missing = missingDetails({ dateOfBirth: child.dateOfBirth, ageGroupSlug: child.ageGroupSlug, parentNames, phones });
  const siblingIds = new Set([child.id, ...siblings.map((s) => s.id)]);

  // Money at a glance, over this year's groups
  const now = new Date();
  const openPayments = payments.filter((p) => enrollments.some((e) => e.id === p.enrollmentId));
  const currency = openPayments[0]?.currency ?? 'TND';
  const sum = (list: typeof openPayments) => list.reduce((total, p) => total + p.amount, 0);
  const paid = openPayments.filter((p) => paymentState(p, now) === 'paid');
  const overdue = openPayments.filter((p) => paymentState(p, now) === 'overdue');
  const upcoming = openPayments.filter((p) => paymentState(p, now) === 'upcoming');
  const nextDue = [...upcoming].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  const firstPhone = phones[0];
  const banner = child.photoColor
    ? `linear-gradient(to bottom right, ${rotateHue(child.photoColor, -25)}, ${child.photoColor}, ${rotateHue(child.photoColor, 35)})`
    : DEFAULT_GRADIENT;

  return (
    <div className="mx-auto max-w-6xl pb-6">
      <Link href="/admin/children" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Children
      </Link>

      {searchParams.created ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Child created. Give the parent the code below: they enter it in the parent portal under &quot;Add a child&quot;.
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {ERRORS[searchParams.error] ?? 'Something went wrong.'}
        </p>
      ) : searchParams.saved ? (
        <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Saved.</p>
      ) : null}

      {/* Profile header */}
      <section className="mt-4 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_60px_-24px_rgba(30,41,90,0.35)]">
        <div className="relative h-24" style={{ background: banner }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
            <div className="absolute bottom-0 right-16 h-16 w-16 rounded-full bg-white/10 blur-lg" />
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            {firstPhone ? (
              <a
                href={`tel:${firstPhone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 backdrop-blur transition hover:bg-white/30"
              >
                <Phone className="h-4 w-4" />
                Call parent
              </a>
            ) : null}
            <Link
              href={`/admin/children/${child.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        <div className="px-6 pb-5 sm:px-8">
          {/* relative so the avatar paints over the banner */}
          <div className="relative -mt-10 flex flex-col gap-4 sm:flex-row sm:items-start">
            {child.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={child.photoUrl}
                alt={child.fullName}
                className="h-20 w-20 shrink-0 rounded-full border-4 border-white object-cover shadow-soft"
              />
            ) : (
              <InitialsAvatar name={child.fullName} className="h-20 w-20 border-4 border-white text-2xl shadow-soft" />
            )}
            {/* starts below the banner edge, never on the colors */}
            <div className="min-w-0 flex-1 sm:pt-12">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="min-w-0 truncate font-display text-3xl font-semibold text-ink">{child.fullName}</h1>
                {child.parentId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <Link2 className="h-3.5 w-3.5" />
                    Parent account linked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                    <KeyRound className="h-3.5 w-3.5" />
                    Waiting for the parent code
                  </span>
                )}
              </div>
              {/* Who the child is, in one line */}
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone">
                {child.ageGroupSlug ? (
                  <span
                    title={child.ageGroupManual ? 'Age group picked by hand' : 'Age group from the date of birth'}
                    className="inline-flex items-center gap-1 font-semibold text-accent"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {ageGroup.label.en}
                    {child.ageGroupManual ? ' (picked by hand)' : ''}
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700">No age group yet</span>
                )}
                <span aria-hidden className="text-ink/20">•</span>
                <span>
                  {age !== null && child.dateOfBirth ? `${age} years old, born ${formatDate(child.dateOfBirth)}` : 'Date of birth not set'}
                </span>
                <span aria-hidden className="text-ink/20">•</span>
                <span>{child.institution ? child.institution : <span className="italic text-stone/70">School not set</span>}</span>
                <span aria-hidden className="text-ink/20">•</span>
                <span>{registeredOn ? `Registered ${formatDate(registeredOn)}` : <span className="italic text-stone/70">Registration date not set</span>}</span>
              </p>
            </div>
          </div>

          {/* Things staff must not miss */}
          {missing.length > 0 || (fit && !fit.fits) || child.specialNeeds ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {child.specialNeeds ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-800 ring-1 ring-inset ring-violet-200">
                  <UserRound className="h-4 w-4" />
                  Special accommodations: {child.specialNeeds}
                </span>
              ) : null}
              {missing.length > 0 ? (
                <Link
                  href={`/admin/children/${child.id}/edit`}
                  title={missingDetailsText(missing)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 transition hover:bg-amber-100"
                >
                  <TriangleAlert className="h-4 w-4" />
                  To complete: {missing.map((m) => MISSING_DETAIL_LABELS[m]).join(', ')}
                </Link>
              ) : null}
              {fit && !fit.fits ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                  <TriangleAlert className="h-4 w-4" />
                  Age {fit.age} this school year, outside {ageGroup.label.en}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* This year at a glance */}
        <div className="grid grid-cols-2 divide-x divide-y divide-ink/5 border-t border-ink/5 bg-slate-50/60 sm:grid-cols-4 sm:divide-y-0">
          <Stat
            label="Courses this year"
            value={String(enrollments.length)}
            hint={enrollments.length ? enrollments.map((e) => courseOf(e.courseSession.courseSlug).title.en).join(', ') : 'Not enrolled yet'}
          />
          <Stat label="Paid" value={money(sum(paid), currency)} hint={`${paid.length} of ${openPayments.length} payments`} tone={paid.length ? 'emerald' : 'ink'} />
          <Stat
            label="Still to pay"
            value={money(sum(upcoming), currency)}
            hint={nextDue ? `Next due ${formatDate(nextDue.dueDate)}` : 'Nothing upcoming'}
          />
          <Stat
            label="Overdue"
            value={overdue.length ? money(sum(overdue), currency) : 'None'}
            hint={overdue.length ? `${overdue.length} payment${overdue.length === 1 ? '' : 's'} late` : 'All on time'}
            tone={overdue.length ? 'red' : 'emerald'}
          />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Side column */}
        <div className="space-y-6">
          <section className={cardClassName}>
            <CardTitle icon={<UserRound />}>Parents</CardTitle>
            {child.parentId ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={String(parent?.fullName ?? '?')} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{String(parent?.fullName ?? 'Parent account')}</p>
                    <p className="text-xs font-semibold text-emerald-600">
                      Linked account
                      {family?.parent1Relation && !family.parent1Name && !family.parent1Phone
                        ? ` · ${PARENT_RELATION_LABELS[family.parent1Relation]}`
                        : ''}
                    </p>
                  </div>
                  <Link
                    href={`/admin/parents?highlight=${child.parentId}#parent-${child.parentId}`}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    View
                  </Link>
                </div>
                <div className="mt-3 space-y-0.5">
                  {[parent?.phone, parent?.secondaryPhone].filter((p): p is string => Boolean(p)).map((p) => (
                    <ContactLink key={p} kind="phone" value={p} />
                  ))}
                  {parent?.email ? <ContactLink kind="email" value={parent.email} /> : null}
                </div>
                {family ? (
                  <div className="mt-4 border-t border-ink/5 pt-4">
                    <p className="mb-2 text-xs text-stone">From the paper records</p>
                    <FamilyParents family={family} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                {family ? (
                  <>
                    <p className="mb-2 text-xs text-stone">From the paper records</p>
                    <FamilyParents family={family} />
                  </>
                ) : (
                  <p className="text-sm text-stone">No parent recorded yet.</p>
                )}
                {child.claimCode ? (
                  <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                      <KeyRound className="h-3.5 w-3.5" />
                      Parent code
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="font-mono text-2xl font-black tracking-widest text-ink">{formatClaimCode(child.claimCode)}</p>
                      <RegenerateCodeButton
                        action={regenerateChildClaimCode.bind(null, child.id)}
                        confirmMessage="Issue a new code? The current code will stop working."
                      />
                    </div>
                    <p className="mt-2 text-xs text-stone">
                      The parent types it in the parent portal under &quot;Add a child&quot;
                      {siblings.length > 0 ? '. It links the brothers and sisters below too.' : '.'}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <section className={cardClassName}>
            <CardTitle icon={<Users />} count={siblings.length}>
              Brothers and sisters
            </CardTitle>
            {siblings.length === 0 ? (
              <p className="mt-3 text-sm text-stone">None linked.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {siblings.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2">
                    <InitialsAvatar name={s.fullName} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/children/${s.id}`} className="block truncate text-sm font-semibold text-ink hover:text-accent hover:underline">
                        {s.fullName}
                      </Link>
                      <p className="text-xs text-stone">{s.dateOfBirth ? `Born ${formatDate(s.dateOfBirth)}` : 'No date of birth'}</p>
                    </div>
                    {/* Only a shared family can be undone here; children on the
                        same parent account stay siblings through the account */}
                    {child.familyId && s.familyId === child.familyId ? (
                      <form action={unlinkSibling.bind(null, child.id, s.id)}>
                        <PendingSubmitButton
                          title={`Take ${s.fullName} out of this family`}
                          className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-stone transition hover:bg-slate-100 hover:text-ink"
                        >
                          Unlink
                        </PendingSubmitButton>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4 rounded-2xl border border-dashed border-ink/15 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-accent">+ Link a brother or sister</summary>
              <form action={linkSibling.bind(null, child.id)} className="mt-4 space-y-3">
                <ChildPicker
                  name="siblingId"
                  options={siblingOptions.filter((o) => !siblingIds.has(o.id))}
                  inputClassName={inputClassName}
                  required
                />
                <p className="text-xs text-stone">
                  They will share the same parents&apos; details{child.parentId ? ' and parent account' : ''}; one parent code links them all.
                </p>
                <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                  Link
                </PendingSubmitButton>
              </form>
            </details>
          </section>

          <section className={cardClassName}>
            <CardTitle icon={<Award />} count={badges.length}>
              Stickers
            </CardTitle>
            {badges.length === 0 ? (
              <p className="mt-3 text-sm text-stone">No stickers yet. Teachers award them from their class roster.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {badges.map((b) => (
                  <li key={b.id} className="rounded-2xl bg-slate-50 p-3 text-center" title={b.note ?? undefined}>
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt={b.title} className="mx-auto h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <span className="block text-4xl leading-[4rem]">{b.emoji}</span>
                    )}
                    <p className="mt-2 text-xs font-bold text-ink">{b.title}</p>
                    <p className="text-[0.65rem] text-stone">
                      {teacherName.get(b.teacherId) ?? 'Teacher'} · {formatDate(b.awardedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <section className={cardClassName}>
            <CardTitle icon={<CalendarClock />} count={enrollments.length}>
              This year
            </CardTitle>
            {enrollments.length === 0 ? (
              <p className="mt-3 text-sm text-stone">Not enrolled in any group yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {enrollments.map((e) => {
                  const s = e.courseSession;
                  const slotLabel = sessionGroupLabel(timeSlots, s);
                  const list = payments
                    .filter((p) => p.enrollmentId === e.id)
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
                  const paidCount = list.filter((p) => paymentState(p, now) === 'paid').length;
                  return (
                    <li key={e.id} className="overflow-hidden rounded-2xl border border-ink/10">
                      <div className="flex flex-wrap items-start justify-between gap-3 bg-slate-50/70 px-4 py-3">
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-ink">
                            <BookOpen className="h-4 w-4 text-accent" />
                            {courseOf(s.courseSlug).title.en}
                            {e.status === 'PENDING' ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
                                Waiting for approval
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatSessionDays(s, DAYS)} {s.startTime}-{s.endTime}
                              {slotLabel ? ` (${slotLabel})` : ''}
                            </span>
                            <span className={`inline-flex items-center gap-1 ${s.teacherId ? '' : 'font-semibold text-amber-700'}`}>
                              <UserRound className="h-3.5 w-3.5" />
                              {s.teacherId ? (teacherName.get(s.teacherId) ?? 'Teacher') : 'No teacher yet'}
                            </span>
                          </p>
                        </div>
                        {list.length > 0 ? (
                          <div className="w-32 shrink-0 text-right">
                            <p className="text-xs font-semibold text-stone">
                              <span className="text-ink">{paidCount}</span> of {list.length} paid
                            </p>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(paidCount / list.length) * 100}%` }} />
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {list.length > 0 ? (
                        <ul className="divide-y divide-ink/5">
                          {list.map((p) => {
                            const state = paymentState(p, now);
                            return (
                              <li
                                key={p.id}
                                className={`grid grid-cols-[6.5rem_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:grid-cols-[6.5rem_7.5rem_1fr_6rem_6.5rem] ${
                                  state === 'overdue' ? 'bg-red-50/40' : ''
                                }`}
                              >
                                <span className={`tabular-nums ${state === 'overdue' ? 'font-semibold text-red-700' : 'text-stone'}`}>
                                  {formatDate(p.dueDate)}
                                </span>
                                <span className="font-semibold tabular-nums text-ink">{money(p.amount, p.currency)}</span>
                                <span className="hidden truncate text-stone sm:block">
                                  {[PLAN_LABELS[p.paymentPlan?.type ?? ''], METHOD_LABELS[p.paymentPlan?.method ?? '']].filter(Boolean).join(' · ')}
                                </span>
                                <span
                                  className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${PAYMENT_STATE[state].className}`}
                                >
                                  {state === 'paid' ? <CircleCheck className="h-3.5 w-3.5" /> : null}
                                  {PAYMENT_STATE[state].label}
                                </span>
                                <span className="col-span-3 justify-self-start sm:col-span-1 sm:justify-self-end">
                                  {state === 'paid' ? (
                                    <span className="text-xs text-stone">{p.paidAt ? formatDate(p.paidAt) : ''}</span>
                                  ) : (
                                    <form action={markChildPaymentPaid.bind(null, child.id, p.id)}>
                                      <PendingSubmitButton className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                                        Mark paid
                                      </PendingSubmitButton>
                                    </form>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="px-4 py-3 text-sm text-stone">No payments recorded for this course.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <details className="group mt-4 rounded-2xl border border-dashed border-ink/15 p-4 open:border-solid open:bg-slate-50/50">
              <summary className="cursor-pointer list-none text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">+ Enroll in a course</span>
                <span className="hidden group-open:inline">Enroll in a course</span>
              </summary>
              <form action={addChildEnrollment.bind(null, child.id)} className="mt-4 space-y-4">
                <StaffEnrollmentFields options={enrollmentOptions} ageGroupSlug={child.ageGroupSlug} />
                <PendingSubmitButton className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                  Enroll
                </PendingSubmitButton>
              </form>
            </details>
          </section>

          <section className={cardClassName}>
            <CardTitle icon={<MessageSquareText />} count={notes.length}>
              Teacher notes
            </CardTitle>
            {notes.length === 0 ? (
              <p className="mt-3 text-sm text-stone">No notes from teachers yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {notes.map((n) => {
                  const author = teacherName.get(n.teacherId) ?? 'Teacher';
                  const course = courseTitleForSession(n.courseSessionId);
                  return (
                    <li key={n.id} className="flex gap-3">
                      <InitialsAvatar name={author} className="h-9 w-9 text-xs" />
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
                        <p className="text-xs text-stone">
                          <span className="font-semibold text-ink">{author}</span>
                          {course ? ` · ${course}` : ''} · {formatDate(n.createdAt)}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-sm text-ink">{n.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={cardClassName}>
            <CardTitle icon={<History />} count={child.pastClasses.length}>
              Previous years
            </CardTitle>
            {child.pastClasses.length === 0 ? (
              <p className="mt-3 text-sm text-stone">No previous classes recorded.</p>
            ) : (
              <ol className="relative mt-4 space-y-4 border-l-2 border-accent/20 pl-5">
                {child.pastClasses.map((c, i) => (
                  <li key={`${i}-${c.course}`} className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-white bg-accent" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {c.schoolYear ? <p className="text-xs font-bold uppercase tracking-wide text-accent">{c.schoolYear}</p> : null}
                        <p className="font-semibold text-ink">{c.course}</p>
                        {c.note ? <p className="text-sm text-stone">{c.note}</p> : null}
                      </div>
                      <DeleteIconButton action={removePastClass.bind(null, child.id, i)} />
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <details className="mt-4 rounded-2xl border border-dashed border-ink/15 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-accent">+ Add a previous year</summary>
              <form action={addPastClass.bind(null, child.id)} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[9rem_1fr] sm:items-end">
                <label className="block">
                  <span className={labelClassName}>School year</span>
                  <input name="schoolYear" placeholder="2024-2025" className={inputClassName} />
                </label>
                <label className="block">
                  <span className={labelClassName}>Course</span>
                  <input name="course" required placeholder="e.g. Robotics Junior" className={inputClassName} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClassName}>Note (optional)</span>
                  <input name="note" placeholder="Any extra detail" className={inputClassName} />
                </label>
                <PendingSubmitButton className="justify-self-start rounded-full bg-ink px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
                  Add
                </PendingSubmitButton>
              </form>
            </details>
          </section>
        </div>
      </div>
    </div>
  );
}
