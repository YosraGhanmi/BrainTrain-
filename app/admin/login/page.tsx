import Link from 'next/link';
import { ArrowLeft, ShieldCheck, ClipboardList, GraduationCap } from 'lucide-react';
import { login } from '@/lib/admin/actions';
import { loginSecretary } from '@/lib/portal-auth/actions';
import PasswordField from '@/components/admin/PasswordField';

type Role = 'admin' | 'secretary';

const ROLE_COPY: Record<Role, { heading: string; accent: string; placeholder: string }> = {
  admin: {
    heading: 'back, Admin!',
    accent: 'BrainTrain Admin',
    placeholder: 'admin@braintrain.tn',
  },
  secretary: {
    heading: 'back, Secretary!',
    accent: 'BrainTrain Secretariat',
    placeholder: 'secretary@braintrain.tn',
  },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; role?: string };
}) {
  const role: Role | null = searchParams.role === 'admin' || searchParams.role === 'secretary' ? searchParams.role : null;

  return (
    <div className="relative isolate flex min-h-screen w-full overflow-hidden bg-[#0b1a3a]">
      {/* White panel behind everything on the left, extended a bit past the
          seam so the diagonal navy panel (painted above it) has something to
          visibly cut into. */}
      <div className="absolute inset-y-0 left-0 z-0 w-full bg-white lg:w-[calc(50%+6rem)]" />

      {/* Decorative navy panel, full height, cut on a diagonal over the white. */}
      <div
        className="absolute inset-y-0 right-0 z-10 hidden w-[55%] flex-col items-center justify-center bg-[#0b1a3a] px-12 text-center lg:flex"
        style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#ff8c42]">BrainTrain</span>
        <h2 className="mt-5 font-display text-7xl font-bold leading-[0.95] text-white xl:text-8xl">
          Welcome
          <br />
          <span className="text-[#ff8c42]">{role ? ROLE_COPY[role].heading : 'to the team!'}</span>
        </h2>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-white/60">
          Every course, photo, and stat on the site lives here. Sign in to update it.
        </p>
      </div>

      <Link
        href="/"
        className="absolute left-8 top-8 z-30 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-stone transition hover:text-ink sm:left-16"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to website
      </Link>

      {/* The form, above both background layers. */}
      <div className="relative z-20 flex w-full items-center px-8 py-16 sm:px-16 lg:w-1/2 lg:pl-24">
        <div className="w-full max-w-md">
          {role ? (
            <Link
              href="/admin/login"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-stone transition hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Choose a different account
            </Link>
          ) : null}
          <span className="block text-sm font-bold uppercase tracking-[0.3em] text-stone">
            {role ? ROLE_COPY[role].accent : 'BrainTrain Staff'}
          </span>
          <h1 className="mt-4 inline-block border-b-4 border-[#ff8c42] pb-3 font-display text-6xl font-bold text-ink">
            Sign in
          </h1>

          {!role ? (
            <div className="mt-12 space-y-3">
              <p className="text-sm text-stone">Who's signing in?</p>

              <Link
                href="/admin/login?role=admin"
                className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-slate-50 px-5 py-4 transition hover:border-accent hover:bg-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b1a3a] text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold text-ink">Admin</span>
                  <span className="block text-sm text-stone">Full site &amp; portal management</span>
                </span>
              </Link>

              <Link
                href="/admin/login?role=secretary"
                className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-slate-50 px-5 py-4 transition hover:border-accent hover:bg-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b1a3a] text-white">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold text-ink">Secretary</span>
                  <span className="block text-sm text-stone">Parents, children &amp; day-to-day admin</span>
                </span>
              </Link>

              <Link
                href="/teacher/login"
                className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-slate-50 px-5 py-4 transition hover:border-accent hover:bg-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0b1a3a] text-white">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold text-ink">Teacher</span>
                  <span className="block text-sm text-stone">Your classes &amp; students</span>
                </span>
              </Link>
            </div>
          ) : (
            <>
              <form action={role === 'admin' ? login : loginSecretary} className="mt-8 space-y-7">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 text-base text-ink outline-none transition focus:border-accent"
                    placeholder={ROLE_COPY[role].placeholder}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
                    Password
                  </label>
                  <PasswordField />
                </div>

                {searchParams.error === 'frozen' ? (
                  <p className="text-sm font-semibold text-red-600">This account has been suspended. Contact BrainTrain for help.</p>
                ) : searchParams.error === 'exists' ? (
                  <p className="text-sm font-semibold text-red-600">A user with that email or phone already exists.</p>
                ) : searchParams.error ? (
                  <p className="text-sm font-semibold text-red-600">Incorrect email or password. Try again.</p>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
                >
                  Log in
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
