import Image from 'next/image';
import Link from 'next/link';
import AdminToast from '@/components/admin/AdminToast';
import SidebarNav from '@/components/admin/SidebarNav';
import RadialReveal from '@/components/effects/RadialReveal';
import { logout } from '@/lib/admin/actions';
import { requireAdmin } from '@/lib/admin/guard';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-ink">
      <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-ink/10 bg-white px-4 py-6">
        <div className="relative h-10 w-full px-2">
          <Image src="/ID BRAINTRAIN.png" alt="BrainTrain logo" fill className="object-contain object-left" />
        </div>

        <SidebarNav />

        <div className="mt-auto pt-8">
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
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-10">{children}</main>
      <AdminToast />
    </div>
  );
}
