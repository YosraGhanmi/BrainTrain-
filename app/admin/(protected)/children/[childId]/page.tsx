import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Cake,
  CalendarCheck,
  CalendarClock,
  History,
  KeyRound,
  Link2,
  Mail,
  MessageSquareText,
  Pencil,
  Phone,
  School,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { addChildEnrollment, addPastClass, markChildPaymentPaid, regenerateChildClaimCode, removePastClass } from '@/lib/admin/children-actions';
import { ageGroupLookup, courseLookup } from '@/lib/content/lookup';
import { ageOn } from '@/lib/content/age-range';
import { rotateHue } from '@/lib/color';
import { formatClaimCode, getDbChild } from '@/lib/db/children';
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
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-600',
  FAILED: 'bg-slate-200 text-slate-600',
};

const inputClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';
const cardClassName = 'rounded-3xl border border-white/60 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(30,41,90,0.35)] sm:p-6';

const formatDate = (date: Date) => date.toLocaleDateString('fr-FR');

function CardTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {children}
      {count ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-stone">{count}</span> : null}
    </h2>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="mt-0.5 text-accent [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
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

  const [parent, enrollments, payments, badges, notes, sessions, teachers, timeSlots, enrollmentOptions] = await Promise.all([
    getDbPortalProfile(child.parentId),
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
  const hasBirthDate = child.dateOfBirth.getTime() > 0;
  const age = hasBirthDate ? ageOn(child.dateOfBirth, new Date()) : null;
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
        <div className="relative h-28" style={{ background: banner }}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
            <div className="absolute bottom-0 right-16 h-16 w-16 rounded-full bg-white/10 blur-lg" />
          </div>
          <Link
            href={`/admin/children/${child.id}/edit`}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>

        <div className="px-6 pb-6 sm:px-8">
          {/* relative so the avatar paints over the banner; the name starts
              below the banner edge instead of under it */}
          <div className="relative -mt-12 flex flex-col gap-4 sm:flex-row sm:items-start">
            {child.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={child.photoUrl}
                alt={child.fullName}
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white object-cover shadow-soft"
              />
            ) : (
              <InitialsAvatar name={child.fullName} className="h-24 w-24 border-4 border-white text-3xl shadow-soft" />
            )}
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:pt-14">
              <h1 className="min-w-0 truncate font-display text-3xl font-semibold text-ink">{child.fullName}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  {ageGroup.label.en}
                </span>
                {age !== null ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-ink">{age} years old</span>
                ) : null}
                {child.parentId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Link2 className="h-3.5 w-3.5" />
                    Linked to a parent account
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Not linked yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon={<Cake />} label="Born" value={hasBirthDate ? formatDate(child.dateOfBirth) : '-'} />
            <Fact icon={<School />} label="School" value={child.institution ?? '-'} />
            <Fact icon={<CalendarCheck />} label="Registered" value={formatDate(child.registeredAt ?? child.createdAt)} />
            <Fact icon={<UserRound />} label="Special accommodations" value={child.specialNeeds ?? 'None'} />
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Side column */}
        <div className="space-y-6">
          <section className={cardClassName}>
            <CardTitle icon={<UserRound />}>Parent</CardTitle>
            {child.parentId ? (
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={String(parent?.fullName ?? '?')} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{String(parent?.fullName ?? 'Parent account')}</p>
                    <p className="text-xs font-semibold text-emerald-600">Linked account</p>
                  </div>
                  <Link
                    href={`/admin/parents?highlight=${child.parentId}#parent-${child.parentId}`}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    View
                  </Link>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-stone">
                    <Phone className="h-4 w-4 text-accent" />
                    {String(parent?.phone || '-')}
                  </li>
                  <li className="flex items-center gap-2 break-all text-stone">
                    <Mail className="h-4 w-4 shrink-0 text-accent" />
                    {String(parent?.email || '-')}
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mt-4">
                <p className="font-semibold text-ink">{child.contactName ?? 'No contact recorded'}</p>
                <p className="text-xs text-stone">From the paper records</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-stone">
                    <Phone className="h-4 w-4 text-accent" />
                    {child.contactPhone ?? '-'}
                  </li>
                  <li className="flex items-center gap-2 break-all text-stone">
                    <Mail className="h-4 w-4 shrink-0 text-accent" />
                    {child.contactEmail ?? '-'}
                  </li>
                </ul>
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
                    <p className="mt-2 text-xs text-stone">The parent types it in the parent portal under &quot;Add a child&quot;.</p>
                  </div>
                ) : null}
              </div>
            )}
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
                  const enrollmentPayments = payments.filter((p) => p.enrollmentId === e.id);
                  return (
                    <li key={e.id} className="rounded-2xl border border-ink/5 bg-slate-50/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 font-semibold text-ink">
                          <BookOpen className="h-4 w-4 text-accent" />
                          {courseOf(s.courseSlug).title.en}
                        </p>
                        <span className="text-xs font-semibold text-stone">
                          {slotLabel ? `${slotLabel} · ` : ''}
                          {formatSessionDays(s, DAYS)} {s.startTime}-{s.endTime}
                          {s.teacherId ? ` · ${teacherName.get(s.teacherId) ?? 'Teacher'}` : ' · No teacher yet'}
                        </span>
                      </div>
                      {enrollmentPayments.length > 0 ? (
                        <ul className="mt-3 space-y-2">
                          {enrollmentPayments.map((p) => (
                            <li key={p.id} className="flex flex-wrap items-center gap-3 text-sm">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STYLES[p.status]}`}>{p.status}</span>
                              <span className="font-semibold text-ink">
                                {p.amount.toFixed(2)} {p.currency}
                              </span>
                              <span className="text-stone">
                                {p.paymentPlan?.type ?? ''} · {p.paymentPlan?.method ?? ''} · due {formatDate(p.dueDate)}
                              </span>
                              {p.status !== 'PAID' ? (
                                <form action={markChildPaymentPaid.bind(null, child.id, p.id)} className="ml-auto">
                                  <PendingSubmitButton className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50">
                                    Mark paid
                                  </PendingSubmitButton>
                                </form>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            <details className="mt-4 rounded-2xl border border-dashed border-ink/15 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-accent">+ Enroll in a course</summary>
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
