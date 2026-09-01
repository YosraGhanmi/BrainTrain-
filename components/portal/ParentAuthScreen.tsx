'use client';

import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { loginParent, registerParent } from '@/lib/portal-auth/actions';
import PasswordInput from '@/components/portal/PasswordInput';
import type { AppLocale } from '@/i18n/routing';

type Mode = 'login' | 'signup';

// The navy panel is one fixed-shape parallelogram (width 90% of the
// container, clip-path never changes) that is only ever moved via its `left`
// offset — never re-clipped or resized — so its diagonal edge holds the same
// angle throughout the slide instead of warping or flattening mid-transition.
// The two resting positions were solved so each end is flush against its
// screen edge with no gap: docked right, its right side overshoots past 100%
// (clipped by the container's overflow-hidden); docked left, its left side
// overshoots past 0% the same way.
const BLADE_LEFT: Record<Mode, string> = { login: '41%', signup: '-31%' };
const BLADE_CLIP = 'polygon(20% 0, 100% 0, 80% 100%, 0% 100%)';

export default function ParentAuthScreen({
  locale,
  initialMode,
  loginError,
  loginSaved,
  registerError,
}: {
  locale: AppLocale;
  initialMode: Mode;
  loginError?: string;
  loginSaved?: string;
  registerError?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const animatingRef = useRef(false);

  const bladeRef = useRef<HTMLDivElement>(null);
  const loginPanelRef = useRef<HTMLDivElement>(null);
  const signupPanelRef = useRef<HTMLDivElement>(null);
  const loginBladeTextRef = useRef<HTMLDivElement>(null);
  const signupBladeTextRef = useRef<HTMLDivElement>(null);

  // The steady-state (non-animating) visibility of each panel/text/blade is
  // derived straight from `mode` in render, not set imperatively in an
  // effect — an effect only runs after the browser's first paint, which for
  // the server-rendered HTML left a frame (visible as a flash on navigation)
  // where both forms and both blade texts were sitting on top of each other
  // at full opacity before JS corrected it. Deriving from render means the
  // very first paint (SSR included) already has the right one hidden.
  const loginActive = mode === 'login';

  const animateTo = (target: Mode) => {
    if (target === mode || animatingRef.current) return;
    animatingRef.current = true;

    const leavingPanel = mode === 'login' ? loginPanelRef.current : signupPanelRef.current;
    const enteringPanel = target === 'login' ? loginPanelRef.current : signupPanelRef.current;
    const leavingText = mode === 'login' ? loginBladeTextRef.current : signupBladeTextRef.current;
    const enteringText = target === 'login' ? loginBladeTextRef.current : signupBladeTextRef.current;
    const enteringFields = enteringPanel?.querySelectorAll('[data-field]') ?? [];

    const tl = gsap.timeline({
      defaults: { ease: 'expo.inOut' },
      onComplete: () => {
        setMode(target);
        animatingRef.current = false;
      },
    });

    tl.set(enteringPanel, { pointerEvents: 'none' }, 0)
      .to(leavingPanel, { opacity: 0, y: -14, duration: 0.35, ease: 'power2.out' }, 0)
      .set(leavingPanel, { pointerEvents: 'none' }, 0.35)
      // The blade — the single "physical" element in this whole transition —
      // gets the full 0.9-1.2s cinematic travel; everything else is timed
      // relative to it rather than the reverse.
      .to(bladeRef.current, { left: BLADE_LEFT[target], duration: 1.05 }, 0.05)
      .to(leavingText, { opacity: 0, y: -10, duration: 0.3 }, 0.15)
      .fromTo(enteringText, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 }, 0.55)
      .fromTo(
        enteringPanel,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onStart: () => gsap.set(enteringPanel, { pointerEvents: 'auto' }) },
        0.65
      )
      .fromTo(
        enteringFields,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
        0.72
      );
  };

  return (
    <div className="relative isolate min-h-screen w-full overflow-hidden bg-white">
      <Link
        href="/"
        className="absolute left-6 top-6 z-30 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to website
      </Link>

      {/* Login form — pinned to the left half, never moves */}
      <div
        ref={loginPanelRef}
        className="absolute inset-y-0 left-0 z-20 flex w-full items-center px-8 py-16 sm:px-16 lg:w-1/2 lg:pl-24"
        style={{ opacity: loginActive ? 1 : 0, pointerEvents: loginActive ? 'auto' : 'none' }}
      >
        <div className="w-full max-w-md">
          <span className="block text-sm font-bold uppercase tracking-[0.3em] text-stone">BrainTrain Parent</span>
          <h1 className="mt-4 inline-block border-b-4 border-[#ff8c42] pb-3 font-display text-6xl font-bold text-ink">Sign in</h1>

          <form action={loginParent} className="mt-12 space-y-7">
            <input type="hidden" name="locale" value={locale} />

            <div data-field className="space-y-2">
              <label htmlFor="parent-login-email" className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">
                Email
              </label>
              <input
                id="parent-login-email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-4 text-base text-ink outline-none transition focus:border-accent"
                placeholder="you@example.com"
              />
            </div>

            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Password</label>
              <PasswordInput name="password" autoComplete="current-password" />
            </div>

            {loginSaved === 'reset' ? (
              <p data-field className="text-sm font-semibold text-emerald-600">
                Password reset. Log in with your new password.
              </p>
            ) : loginSaved === 'password-changed' ? (
              <p data-field className="text-sm font-semibold text-emerald-600">
                Password changed. Log in with your new password.
              </p>
            ) : null}
            {loginError ? (
              <p data-field className="text-sm font-semibold text-red-600">
                Incorrect email or password. Try again.
              </p>
            ) : null}

            <button
              type="submit"
              data-field
              className="w-full rounded-full bg-[#0b1a3a] px-6 py-4 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
            >
              Log in
            </button>
          </form>

          <div data-field className="mt-6 flex items-center justify-between text-sm">
            <Link href="/parent-portal/forgot-password" className="font-semibold text-stone hover:text-ink">
              Forgot password?
            </Link>
            <button type="button" onClick={() => animateTo('signup')} className="font-semibold text-accent hover:underline">
              Create an account
            </button>
          </div>
        </div>
      </div>

      {/* Sign-up form — pinned to the right half, never moves */}
      <div
        ref={signupPanelRef}
        className="absolute inset-y-0 right-0 z-20 flex w-full items-center px-8 py-16 sm:px-16 lg:w-1/2 lg:pr-24"
        style={{ opacity: loginActive ? 0 : 1, pointerEvents: loginActive ? 'none' : 'auto' }}
      >
        <div className="ml-auto w-full max-w-md">
          <span className="block text-sm font-bold uppercase tracking-[0.3em] text-stone">BrainTrain Parent</span>
          <h1 className="mt-4 inline-block border-b-4 border-[#ff8c42] pb-3 font-display text-6xl font-bold text-ink">Sign up</h1>

          <form action={registerParent} className="mt-10 space-y-5">
            <input type="hidden" name="locale" value={locale} />

            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Full name</label>
              <input
                name="fullName"
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 text-base text-ink outline-none transition focus:border-accent"
              />
            </div>

            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 text-base text-ink outline-none transition focus:border-accent"
                placeholder="you@example.com"
              />
            </div>

            {/* Not in the original field list, but required — phone is a
                unique account identifier used for SMS password resets. */}
            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Phone number</label>
              <input
                name="phone"
                type="tel"
                required
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-5 py-3.5 text-base text-ink outline-none transition focus:border-accent"
                placeholder="+216 ..."
              />
            </div>

            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Password</label>
              <PasswordInput name="password" autoComplete="new-password" />
            </div>

            <div data-field className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-[0.2em] text-stone">Confirm password</label>
              <PasswordInput name="confirmPassword" autoComplete="new-password" />
            </div>

            {registerError === 'exists' ? (
              <p data-field className="text-sm font-semibold text-red-600">
                An account with that email or phone already exists.
              </p>
            ) : registerError ? (
              <p data-field className="text-sm font-semibold text-red-600">
                Please check the form (passwords must match, 8+ characters).
              </p>
            ) : null}

            <button
              type="submit"
              data-field
              className="w-full rounded-full bg-[#0b1a3a] px-6 py-3.5 text-base font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent"
            >
              Create account
            </button>
          </form>

          <p data-field className="mt-6 text-center text-sm text-stone">
            Already have an account?{' '}
            <button type="button" onClick={() => animateTo('login')} className="font-semibold text-accent hover:underline">
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* The sliding navy blade */}
      <div
        ref={bladeRef}
        className="absolute inset-y-0 z-10 hidden w-[90%] bg-[#0b1a3a] text-center lg:block"
        style={{ clipPath: BLADE_CLIP, willChange: 'left', left: BLADE_LEFT[mode] }}
      >
        {/* The blade's own box is 90% wide and overshoots off-screen on one
            side in each docked state (see BLADE_LEFT/BLADE_CLIP comment
            above), so its geometric center isn't the visible navy area's
            center — each text block gets its own hand-tuned anchor instead
            of a shared flex-center. */}
        {/* Outer div: static positioning only (left/top/-50%,-50% centering),
            never touched by GSAP. Inner div: the only thing GSAP animates
            (opacity/y) — keeping the two apart means GSAP's `y` tween can't
            clobber the percentage-based centering transform on the outer
            one (GSAP owns whatever `transform` it animates outright, so
            mixing an animated `y` onto an element that also needs a fixed
            translate(-50%,-50%) for positioning is a recipe for the two
            fighting over the same CSS property). */}
        <div className="absolute w-max max-w-[85vw] px-6" style={{ left: '38%', top: '36%', transform: 'translate(-50%, -50%)' }}>
          <div ref={loginBladeTextRef} style={{ opacity: loginActive ? 1 : 0 }}>
            <span className="text-base font-bold uppercase tracking-[0.3em] text-[#ff8c42]">BrainTrain</span>
            <h2 className="mt-6 whitespace-nowrap font-display text-6xl font-bold leading-[0.95] text-white xl:text-7xl">
              Welcome <span className="text-[#ff8c42]">back!</span>
            </h2>
          </div>
        </div>
        <div className="absolute w-max max-w-[85vw] px-6" style={{ left: '62%', top: '36%', transform: 'translate(-50%, -50%)' }}>
          <div ref={signupBladeTextRef} style={{ opacity: loginActive ? 0 : 1 }}>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#ff8c42]">BrainTrain</span>
            <h2 className="mt-5 whitespace-nowrap font-display text-6xl font-bold leading-[0.95] text-white xl:text-7xl">
              Join the
              <br />
              <span className="text-[#ff8c42]">BrainTrain family</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-white/60">
              Create your account to add your children and enroll them in courses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
