import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  CalendarDays,
  MapPin,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowLeft,
  ChevronRight,
  Compass,
  Trophy,
  Flag,
  Settings2,
  Wifi,
  Box,
  Settings,
  Mail,
  Clock3,
} from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { estimateCompletedSessions, percentFromCompleted } from '@/lib/progress';
import { unenrollChild } from '@/lib/enrollment/actions';
import { payNow } from '@/lib/payments/actions';
import UnsubscribeButton from '@/components/portal/UnsubscribeButton';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import ProgressBar from '@/components/portal/course/ProgressBar';
import InitialsAvatar from '@/components/portal/course/InitialsAvatar';
import NotesList from '@/components/portal/course/NotesList';
import PaymentConfirmedModal from '@/components/portal/course/PaymentConfirmedModal';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

const MILESTONES: { label: string; icon: typeof Flag }[] = [
  { label: 'Start', icon: Flag },
  { label: 'Foundations', icon: Settings2 },
  { label: 'Practice', icon: Wifi },
  { label: 'Building', icon: Box },
  { label: 'Mastery', icon: Trophy },
];

const BADGE_PALETTE = ['#6c5ce7', '#f7b500', '#00b894', '#3d7fff', '#ff8c42'];

export default async function EnrolledCoursePage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; childId: string; enrollmentId: string };
  searchParams: { error?: string };
}) {
  const parent = await requireParent(params.locale);

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: params.enrollmentId },
    include: {
      child: true,
      courseSession: { include: { teacher: { include: { user: true } } } },
      notes: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { dueDate: 'asc' }, include: { paymentPlan: true } },
    },
  });

  if (!enrollment || enrollment.childId !== params.childId || enrollment.child.parentId !== parent.parentId) {
    notFound();
  }

  const course = getCourseEntryOrThrow(enrollment.courseSession.courseSlug);
  const Icon = getIcon(course.icon);
  const session = enrollment.courseSession;
  const teacherName = session.teacher?.user.fullName ?? null;
  const teacherEmail = session.teacher?.user.email ?? null;

  // Nothing here is real yet while an admin hasn't confirmed the payment —
  // show a focused waiting screen instead of course progress/badges/notes
  // that don't apply until the enrollment is actually active.
  if (enrollment.status === 'PENDING') {
    const pendingPayment = enrollment.payments[0];
    return (
      <div className="w-full pb-16">
        <Link
          href={`/parent-portal/children/${enrollment.child.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {enrollment.child.fullName}
        </Link>

        <div className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#dce6ff] via-[#e6dcfb] to-[#fbdcec] p-10 text-center shadow-soft sm:p-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute -bottom-24 right-24 h-64 w-64 animate-float rounded-full bg-white/30 blur-2xl" />
          </div>

          <div className="relative mx-auto flex max-w-md flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
              <Clock3 className="h-7 w-7 text-amber-500" />
            </div>
            <span className="mt-5 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
              Pending
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-3xl">We're checking with Admin</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {enrollment.child.fullName}'s enrollment in <strong>{course.title.en}</strong> is on its way — an admin
              just needs to confirm your payment before the seat is locked in. You'll get a text message the moment
              it's approved, and the course will unlock right here.
            </p>

            <div className="mt-6 w-full rounded-2xl bg-white/70 p-4 text-left text-sm text-ink/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{course.title.en}</span>
                <span>{DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}</span>
              </div>
              {pendingPayment ? (
                <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-2 text-ink/70">
                  <span>{pendingPayment.paymentPlan.method === 'CASH' ? 'Cash' : pendingPayment.paymentPlan.method === 'CHEQUE' ? 'Cheque' : 'Card'} payment</span>
                  <span className="font-semibold text-ink">{Number(pendingPayment.amount)} {pendingPayment.currency}</span>
                </div>
              ) : null}
            </div>

            <Link
              href="/parent-portal"
              className="mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badges = await prisma.badge.findMany({
    where: { childId: enrollment.childId, courseSessionId: enrollment.courseSessionId },
    orderBy: { awardedAt: 'desc' },
  });

  const outstandingPayment = enrollment.payments.find((p) => p.status !== 'PAID');
  const isFullyPaid = enrollment.payments.length > 0 && !outstandingPayment;

  // Cash/cheque payments are confirmed by staff, not by the parent's own
  // checkout redirect (unlike card payments, which get instant feedback from
  // Stripe) — show a one-time popup the first time the parent sees it.
  const justConfirmedPayment = enrollment.payments.find(
    (p) => p.status === 'PAID' && p.parentNotifiedAt === null && p.paymentPlan.method !== 'CARD',
  );

  const totalSessions = course.sessions;
  const completedSessions = estimateCompletedSessions(enrollment.enrolledAt, totalSessions);
  const percent = percentFromCompleted(completedSessions, totalSessions);
  const tagline = course.description.en.split('.')[0] + '.';

  const displayedBadges = badges.slice(0, 4);
  const lockedBadgeSlots = Math.max(0, 4 - displayedBadges.length);

  return (
    <div className="w-full pb-16">
      {justConfirmedPayment ? (
        <PaymentConfirmedModal
          paymentId={justConfirmedPayment.id}
          locale={params.locale}
          courseTitle={course.title.en}
          amount={Number(justConfirmedPayment.amount)}
          currency={justConfirmedPayment.currency}
        />
      ) : null}

      <Link
        href={`/parent-portal/children/${enrollment.child.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {enrollment.child.fullName}
      </Link>

      {searchParams.error === 'already' ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">This enrollment is already cancelled.</p>
      ) : null}

      {/* Hero */}
      <div className="relative mt-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#dce6ff] via-[#e6dcfb] to-[#fbdcec] p-8 shadow-soft sm:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-24 right-24 h-64 w-64 animate-float rounded-full bg-white/30 blur-2xl" />
          <Sparkles className="absolute right-[22%] top-8 h-5 w-5 text-white/70" />
          <Settings className="absolute right-[8%] top-1/2 h-6 w-6 animate-float text-white/60" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[enrollment.status]}`}>
              {enrollment.status}
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-ink sm:text-5xl">{course.title.en}</h1>
            <p className="mt-3 text-base text-ink/70">{tagline}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-ink/70">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {session.location}
              </span>
            </div>

            {isFullyPaid ? (
              <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Course paid
              </span>
            ) : null}
          </div>

          <div className="h-32 w-32 shrink-0 sm:h-40 sm:w-40">
            <CourseIllustration icon={Icon} color={course.color} className="h-full w-full" />
          </div>
        </div>
      </div>

      {outstandingPayment ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
          <span className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Payment {outstandingPayment.status === 'OVERDUE' ? 'overdue' : 'due'}: {Number(outstandingPayment.amount)} {outstandingPayment.currency}
          </span>
          <form action={payNow}>
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="paymentId" value={outstandingPayment.id} />
            <input type="hidden" name="childId" value={enrollment.child.id} />
            <button type="submit" className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
              Pay now
            </button>
          </form>
        </div>
      ) : null}

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/parent-portal/schedule"
          className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
            <CalendarDays className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">Next session</p>
            <p className="truncate text-base font-bold text-ink">{DAYS[session.dayOfWeek]}</p>
            <p className="text-xs text-stone">{session.startTime} – {session.endTime}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone/40" />
        </Link>

        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent2/10">
            <MapPin className="h-5 w-5 text-accent2" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">Location</p>
            <p className="truncate text-base font-bold text-ink">{session.location}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone/40" />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">Teacher</p>
            <p className="truncate text-base font-bold text-ink" title={teacherName ?? undefined}>
              {teacherName ?? 'Not yet assigned'}
            </p>
            <p className="truncate text-xs text-stone">{course.title.en}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone/40" />
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Learning journey */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <Compass className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">Your {course.title.en} journey</h2>
                  <p className="text-xs font-medium text-stone">
                    {percent >= 100 ? 'Amazing work, all done!' : 'Keep going! You’re doing great!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-extrabold text-ink">{percent}%</p>
                <p className="text-xs font-semibold text-stone">{completedSessions} / {totalSessions} sessions completed</p>
              </div>
            </div>

            <div className="mt-5">
              <ProgressBar percent={percent} />
            </div>

            <div className="relative mt-10 flex items-start justify-between">
              <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-ink/5" />
              <div
                className="absolute left-0 top-5 h-1 rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-1000"
                style={{ width: `${percent}%` }}
              />
              {MILESTONES.map((milestone, i) => {
                const threshold = (i / (MILESTONES.length - 1)) * 100;
                const prevThreshold = i === 0 ? -1 : ((i - 1) / (MILESTONES.length - 1)) * 100;
                const reached = percent >= threshold;
                const current = !reached && percent >= prevThreshold;
                const MilestoneIcon = milestone.icon;
                return (
                  <div key={milestone.label} className="relative z-10 flex flex-col items-center gap-2" style={{ width: `${100 / MILESTONES.length}%` }}>
                    <div className="relative">
                      <div
                        className={`flex items-center justify-center rounded-full border-4 border-white shadow-soft transition ${
                          current ? 'h-11 w-11 bg-accent text-white ring-4 ring-accent/20' : reached ? 'h-10 w-10 bg-accent/90 text-white' : 'h-10 w-10 bg-slate-100 text-stone/50'
                        }`}
                      >
                        <MilestoneIcon className="h-4 w-4" />
                      </div>
                      {reached ? (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </span>
                      ) : null}
                    </div>
                    <span className={`text-center text-xs font-semibold ${reached || current ? 'text-ink' : 'text-stone/50'}`}>{milestone.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Teacher updates */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-bold text-ink">Teacher updates</h2>
              </div>
            </div>

            <div className="mt-4">
              {enrollment.notes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink/15 bg-slate-50 p-6 text-center text-sm text-stone">
                  No updates yet — your teacher will post notes here after class.
                </p>
              ) : (
                <NotesList
                  teacherName={teacherName}
                  notes={enrollment.notes.map((note) => ({
                    id: note.id,
                    content: note.content,
                    createdAt: note.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  }))}
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Badges */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-bold text-ink">My badges</h2>
              </div>
              <Link href={`/parent-portal/children/${enrollment.child.id}`} className="text-xs font-bold text-accent hover:underline">
                View all
              </Link>
            </div>

            {badges.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
                <Sparkles className="h-7 w-7 text-accent" />
                <p className="text-sm font-semibold text-ink">Your first badge is waiting!</p>
                <p className="text-xs text-stone">Complete your first challenge to unlock it.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {displayedBadges.map((badge, i) => (
                  <div
                    key={badge.id}
                    title={badge.note ?? undefined}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-ink/5 bg-slate-50 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-goldglow"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm"
                      style={{ backgroundColor: `${BADGE_PALETTE[i % BADGE_PALETTE.length]}1f` }}
                    >
                      {badge.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span>{badge.emoji}</span>
                      )}
                    </div>
                    <p className="truncate text-xs font-bold text-ink">{badge.title}</p>
                    <p className="flex items-center gap-1 text-[0.65rem] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Unlocked
                    </p>
                  </div>
                ))}
                {Array.from({ length: lockedBadgeSlots }).map((_, i) => (
                  <div
                    key={`locked-${i}`}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink/10 bg-slate-50 p-4 text-center opacity-70"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5">
                      <Lock className="h-4 w-4 text-stone" />
                    </div>
                    <p className="text-xs font-bold text-stone">Mystery</p>
                    <p className="flex items-center gap-1 text-[0.65rem] font-semibold text-stone/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone/40" />
                      Locked
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher profile */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
            <h2 className="font-display text-lg font-bold text-ink">Your teacher</h2>
            <div className="mt-4 flex flex-col items-center gap-3 text-center">
              {teacherName ? (
                <InitialsAvatar name={teacherName} className="h-16 w-16 text-lg" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink/5">
                  <User className="h-6 w-6 text-stone" />
                </div>
              )}
              <div>
                <p className="font-bold text-ink">{teacherName ?? 'Not yet assigned'}</p>
                <p className="text-sm text-stone">{course.title.en} Teacher</p>
              </div>
              {teacherEmail ? (
                <a
                  href={`mailto:${teacherEmail}`}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-accent/30 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/5"
                >
                  <Mail className="h-4 w-4" />
                  Send a message
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6">
        <Link
          href="/parent-portal/account"
          className="flex items-center gap-1.5 text-xs font-semibold text-stone/70 transition hover:text-ink"
        >
          <Settings className="h-3.5 w-3.5" />
          Course settings
        </Link>

        {enrollment.status !== 'CANCELLED' ? (
          <form action={unenrollChild}>
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <input type="hidden" name="childId" value={enrollment.child.id} />
            <UnsubscribeButton />
          </form>
        ) : null}
      </div>
    </div>
  );
}
