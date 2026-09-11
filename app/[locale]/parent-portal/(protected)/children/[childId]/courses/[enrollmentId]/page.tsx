import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
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
  Trophy,
  Settings,
  Clock3,
} from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireParent } from '@/lib/portal-auth/guard';
import { getCourseEntryOrThrow } from '@/lib/content/lookup';
import { getIcon } from '@/lib/content/icons';
import { localized, formatDate } from '@/lib/i18n/format';
import { unenrollChild } from '@/lib/enrollment/actions';
import { payNow } from '@/lib/payments/actions';
import UnsubscribeButton from '@/components/portal/UnsubscribeButton';
import CourseIllustration from '@/components/illustrations/CourseIllustration';
import NotesList from '@/components/portal/course/NotesList';
import PaymentConfirmedModal from '@/components/portal/course/PaymentConfirmedModal';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

const BADGE_PALETTE = ['#6c5ce7', '#f7b500', '#00b894', '#3d7fff', '#ff8c42'];

export default async function EnrolledCoursePage({
  params,
  searchParams,
}: {
  params: { locale: AppLocale; childId: string; enrollmentId: string };
  searchParams: { error?: string };
}) {
  const parent = await requireParent(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: 'parentPortal.courseEnrollment' });
  const tc = await getTranslations({ locale: params.locale, namespace: 'common' });
  const DAYS = tc.raw('days') as string[];

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

  // Nothing here is real yet while an admin hasn't confirmed the payment —
  // show a focused waiting screen instead of course progress/badges/notes
  // that don't apply until the enrollment is actually active.
  if (enrollment.status === 'PENDING') {
    const pendingPayment = enrollment.payments[0];
    return (
      <div className="w-full pb-16">
        <Link
          href="/parent-portal/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToCourses')}
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
              {t('pending')}
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-3xl">{t('checkingWithAdmin')}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {t.rich('pendingBody', {
                name: enrollment.child.fullName,
                course: localized(course.title, params.locale),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            <div className="mt-6 w-full rounded-2xl bg-white/70 p-4 text-left text-sm text-ink/80 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="font-semibold text-ink">{localized(course.title, params.locale)}</span>
                <span>{DAYS[session.dayOfWeek]} · {session.startTime}–{session.endTime}</span>
              </div>
              {pendingPayment ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-ink/5 pt-2 text-ink/70">
                  <span>{t('paymentMethod', { method: t(`methods.${pendingPayment.paymentPlan.method}`) })}</span>
                  <span className="font-semibold text-ink">{Number(pendingPayment.amount)} {pendingPayment.currency}</span>
                </div>
              ) : null}
            </div>

            <Link
              href="/parent-portal"
              className="mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              {t('backToDashboard')}
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

  const tagline = localized(course.description, params.locale).split('.')[0] + '.';

  const displayedBadges = badges.slice(0, 4);
  const lockedBadgeSlots = Math.max(0, 4 - displayedBadges.length);

  return (
    <div className="w-full pb-16">
      {justConfirmedPayment ? (
        <PaymentConfirmedModal
          paymentId={justConfirmedPayment.id}
          locale={params.locale}
          courseTitle={localized(course.title, params.locale)}
          amount={Number(justConfirmedPayment.amount)}
          currency={justConfirmedPayment.currency}
        />
      ) : null}

      <Link
        href="/parent-portal/courses"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToCourses')}
      </Link>

      {searchParams.error === 'already' ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">{t('alreadyCancelled')}</p>
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
              {t(`status.${enrollment.status}`)}
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-ink sm:text-4xl lg:text-5xl">{localized(course.title, params.locale)}</h1>
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
                {t('coursePaid')}
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
            {outstandingPayment.status === 'OVERDUE' ? t('paymentOverdue') : t('paymentDue')}: {Number(outstandingPayment.amount)} {outstandingPayment.currency}
          </span>
          <form action={payNow}>
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="paymentId" value={outstandingPayment.id} />
            <input type="hidden" name="childId" value={enrollment.child.id} />
            <button type="submit" className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
              {t('payNow')}
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
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">{t('nextSession')}</p>
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
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">{t('location')}</p>
            <p className="truncate text-base font-bold text-ink">{session.location}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone/40" />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-glow">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wide text-stone">{t('teacher')}</p>
            <p className="truncate text-base font-bold text-ink" title={teacherName ?? undefined}>
              {teacherName ?? t('notYetAssigned')}
            </p>
            <p className="truncate text-xs text-stone">{localized(course.title, params.locale)}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-stone/40" />
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Teacher updates */}
          <div className="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-bold text-ink">{t('teacherUpdates')}</h2>
              </div>
            </div>

            <div className="mt-4">
              {enrollment.notes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-ink/15 bg-slate-50 p-6 text-center text-sm text-stone">
                  {t('noUpdatesYet')}
                </p>
              ) : (
                <NotesList
                  teacherName={teacherName}
                  notes={enrollment.notes.map((note) => ({
                    id: note.id,
                    content: note.content,
                    createdAt: formatDate(note.createdAt, params.locale, { month: 'short', day: 'numeric', year: 'numeric' }),
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
                <h2 className="font-display text-lg font-bold text-ink">{t('myBadges')}</h2>
              </div>
              <Link href="/parent-portal#badges" className="text-xs font-bold text-accent hover:underline">
                {t('viewAll')}
              </Link>
            </div>

            {badges.length === 0 ? (
              <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
                <Sparkles className="h-7 w-7 text-accent" />
                <p className="text-sm font-semibold text-ink">{t('firstBadgeWaiting')}</p>
                <p className="text-xs text-stone">{t('completeFirstChallenge')}</p>
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
                      {t('unlocked')}
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
                    <p className="text-xs font-bold text-stone">{t('mystery')}</p>
                    <p className="flex items-center gap-1 text-[0.65rem] font-semibold text-stone/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone/40" />
                      {t('locked')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      {enrollment.status !== 'CANCELLED' ? (
        <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 pt-6">
          <form action={unenrollChild}>
            <input type="hidden" name="locale" value={params.locale} />
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <input type="hidden" name="childId" value={enrollment.child.id} />
            <UnsubscribeButton />
          </form>
        </div>
      ) : null}
    </div>
  );
}
