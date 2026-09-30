'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

export type FormStep = {
  title: string;
  description?: string;
  icon: ReactNode;
  optional?: boolean;
  content: ReactNode;
};

// One <form> split into steps. Every step stays mounted (only hidden), so all
// fields submit together at the end; each step's required fields are checked
// before moving on, since the browser can't point at a field in a hidden step.
export default function FormSteps({
  action,
  steps,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  steps: FormStep[];
  submitLabel: string;
}) {
  const [current, setCurrent] = useState(0);
  const [reached, setReached] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isLast = current === steps.length - 1;

  const stepIsValid = (index: number) => {
    const fields = stepRefs.current[index]?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    );
    for (const field of fields ?? []) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    return true;
  };

  const goTo = (index: number) => {
    // Forward jumps must pass through each step's checks
    for (let i = current; i < index; i++) {
      if (!stepIsValid(i)) {
        setCurrent(i);
        return;
      }
    }
    setCurrent(index);
    setReached((r) => Math.max(r, index));
  };

  // Enter in a text field moves to the next step instead of submitting early
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isLast) {
      event.preventDefault();
      goTo(current + 1);
    }
  };

  const progress = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;

  return (
    <form action={action} onSubmit={onSubmit} className="mt-6">
      {/* Stepper: the track runs between the first and last circle centers
          (half of each item's w-24 / sm:w-32 width in from either side) */}
      <div className="relative">
      <div className="absolute left-12 right-12 top-5 h-1 rounded-full bg-white/70 sm:left-16 sm:right-16" aria-hidden>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="relative flex items-start justify-between">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = i <= reached && !active;
          return (
            <li key={step.title} className="relative z-10 flex w-24 flex-col items-center text-center sm:w-32">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => goTo(i)}
                aria-current={active ? 'step' : undefined}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-4 font-display text-sm font-bold transition ${
                  active
                    ? 'scale-110 border-white bg-ink text-white shadow-[0_8px_24px_-6px_rgba(11,12,16,0.5)]'
                    : done
                      ? 'border-white bg-emerald-500 text-white hover:scale-105'
                      : 'border-white bg-white/80 text-stone'
                } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {done ? <Check className="h-5 w-5" strokeWidth={3} /> : i + 1}
              </button>
              <span className={`mt-2 text-xs font-bold uppercase tracking-wide ${active ? 'text-ink' : 'text-ink/50'}`}>{step.title}</span>
              {step.optional ? <span className="text-[0.65rem] font-semibold text-ink/40">Optional</span> : null}
            </li>
          );
        })}
      </ol>
      </div>

      {/* Step panels */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_24px_60px_-24px_rgba(30,41,90,0.35)]">
        {steps.map((step, i) => (
          <div
            key={step.title}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            hidden={i !== current}
            className="animate-[step-in_300ms_ease-out]"
          >
            <div className="flex items-center gap-4 border-b border-ink/5 bg-gradient-to-r from-accent/10 via-accent2/5 to-transparent px-6 py-4 sm:px-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-accent shadow-sm [&>svg]:h-5 [&>svg]:w-5">
                {step.icon}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                  Step {i + 1} of {steps.length}
                </p>
                <h2 className="font-display text-xl font-bold text-ink">{step.title}</h2>
                {step.description ? <p className="mt-0.5 text-sm text-stone">{step.description}</p> : null}
              </div>
            </div>
            <div className="px-6 py-5 sm:px-8">{step.content}</div>
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-ink/5 bg-slate-50/70 px-6 py-3 sm:px-8">
          {current > 0 ? (
            <button
              type="button"
              onClick={() => setCurrent(current - 1)}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}

          {isLast ? (
            <PendingSubmitButton className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent">
              {submitLabel}
            </PendingSubmitButton>
          ) : (
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
