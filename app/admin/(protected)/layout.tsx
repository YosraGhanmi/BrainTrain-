import Image from 'next/image';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import AdminToast from '@/components/admin/AdminToast';
import SidebarNav from '@/components/admin/SidebarNav';
import RadialReveal from '@/components/effects/RadialReveal';
import { logout } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/guard';
import { getAdminNotifications } from '@/lib/admin/notifications';
import { readMessages } from '@/lib/messages/store';
import { countPendingDbEnrollments } from '@/lib/db/enrollments';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const unreadMessages = (await readMessages()).filter((m) => !m.read).length;
  const [pendingEnrollments, notifications] = await Promise.all([countPendingDbEnrollments(), getAdminNotifications()]);

  const noticeBadges: Record<string, number> = {};
  for (const notice of [...notifications.paymentNotices, ...notifications.expenseNotices]) {
    if (notice.link) noticeBadges[notice.link] = (noticeBadges[notice.link] ?? 0) + 1;
  }

  const sidebar = (
    <>
      <div className="relative h-10 w-full px-2">
        <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill className="object-contain object-left" />
      </div>

      <SidebarNav
        role={session.kind}
        unreadMessages={unreadMessages}
        pendingEnrollments={pendingEnrollments}
        noticeBadges={noticeBadges}
      />

      <div className="mt-auto pt-8">
        <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-stone/60">
          Signed in as {session.kind === 'admin' ? 'Admin' : `Reception (${session.fullName})`}
        </p>
        <form action={logout}>
          <RadialReveal
            boxClassName="w-full justify-center rounded-full border border-ink bg-ink shadow-sm"
            faceClassName="w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em]"
            restColorClassName="text-white"
            hoverColorClassName="bg-accent text-white"
          >
            Log out
          </RadialReveal>
        </form>

        <Link
          href="/"
          className="mt-2 block rounded-xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-stone/70 transition hover:text-ink"
        >
          ← Back to site
        </Link>
      </div>
    </>
  );

  return (
    <AdminShell sidebar={sidebar} notifications={notifications}>
      {children}
      <AdminToast />
    </AdminShell>
  );
}
