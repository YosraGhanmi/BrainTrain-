'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

type Group = {
  id: string;
  label: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  seatsLeft: number;
  enrolled: boolean;
};

type PlanInfo = { type: string; label: string; hint: string; amount: number; currency: string };
type MethodInfo = { type: string; label: string };

const STEPS = [
  { n: 1, label: 'Group' },
  { n: 2, label: 'Plan' },
  { n: 3, label: 'Method' },
] as const;

export default function EnrollWizard({
  action,
  locale,
  childId,
  courseSlug,
  groups,
  dayNumbers,
  dayNames,
  plans,
  methods,
  showSuccess,
}: {
  action: (formData: FormData) => void;
  locale: string;
  childId: string;
  courseSlug: string;
  groups: Group[];
  dayNumbers: number[];
  dayNames: string[];
  plans: PlanInfo[];
  methods: MethodInfo[];
  showSuccess: boolean;
}) {
  const [step, setStep] = useState(1);
  const [groupId, setGroupId] = useState('');
  const [planType, setPlanType] = useState('');
  const [method, setMethod] = useState('');
  const [successOpen, setSuccessOpen] = useState(showSuccess);

  const selectedGroup = groups.find((g) => g.id === groupId);
  const selectedPlan = plans.find((p) => p.type === planType);

  const canLeaveStep1 = Boolean(groupId);
  const canLeaveStep2 = Boolean(planType);
  const canSubmit = Boolean(groupId && planType && method);

  return (
    <>
      <form action={action} className="mt-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="childId" value={childId} />
        <input type="hidden" name="courseSlug" value={courseSlug} />
        <input type="hidden" name="courseSessionId" value={groupId} />
        <input type="hidden" name="planType" value={planType} />
        <input type="hidden" name="paymentMethod" value={method} />

        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === s.n ? 'bg-ink text-white' : step > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-stone'
                  }`}
                >
                  {s.n}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wide ${step === s.n ? 'text-ink' : 'text-stone'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? <span className="mx-3 h-px w-8 bg-ink/10" /> : null}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl border border-[#0b1a3a]/20 bg-[#0b1a3a] p-6 sm:grid-cols-3 lg:grid-cols-4">
            {dayNumbers.map((day) => (
              <div key={day}>
                <h3 className="text-center text-sm font-bold uppercase tracking-wide text-white">{dayNames[day]}</h3>
                <div className="mt-3 space-y-2">
                  {groups
                    .filter((g) => g.dayOfWeek === day)
                    .map((g) => {
                      const full = g.seatsLeft <= 0;
                      const disabled = g.enrolled || full;
                      const checked = groupId === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setGroupId(g.id)}
                          className={`block w-full rounded-xl border p-3 text-center transition ${
                            checked
                              ? 'border-accent bg-accent text-white'
                              : full && !g.enrolled
                                ? 'border-red-500/40 bg-red-500/10'
                                : 'border-white/20 bg-white/10'
                          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${g.enrolled ? 'opacity-50' : ''}`}
                        >
                          <p className="text-sm font-bold text-white">{g.label}</p>
                          <p className="mt-0.5 text-xs text-white/80">
                            {g.startTime}–{g.endTime}
                          </p>
                          <p className={`mt-0.5 text-[0.65rem] font-semibold ${full && !g.enrolled ? 'text-red-400' : 'text-white/60'}`}>
                            {g.enrolled ? 'Already enrolled' : full ? 'Full' : `${g.seatsLeft} seats left`}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((p) => {
              const checked = planType === p.type;
              return (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => setPlanType(p.type)}
                  className={`rounded-2xl border p-4 text-center shadow-sm transition ${
                    checked ? 'border-accent bg-accent text-white' : 'border-ink/10 bg-white text-ink hover:border-accent/40'
                  }`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wide ${checked ? 'text-white/80' : 'text-stone'}`}>{p.label}</p>
                  <p className="mt-1 font-display text-xl font-bold">
                    {p.amount} {p.currency}
                  </p>
                  <p className={`mt-1 text-xs ${checked ? 'text-white/80' : 'text-stone'}`}>{p.hint}</p>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {methods.map((m) => {
              const checked = method === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => setMethod(m.type)}
                  className={`rounded-2xl border p-4 text-center text-sm font-bold shadow-sm transition ${
                    checked ? 'border-accent bg-accent text-white' : 'border-ink/10 bg-white text-ink hover:border-accent/40'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {selectedGroup ? (
          <p className="mt-4 text-xs text-stone">
            {selectedGroup.label} · {selectedGroup.startTime}–{selectedGroup.endTime}
            {selectedPlan ? ` · ${selectedPlan.label} (${selectedPlan.amount} ${selectedPlan.currency})` : ''}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-full border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-100"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 ? !canLeaveStep1 : !canLeaveStep2}
              onClick={() => setStep(step + 1)}
              className="ml-auto rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="ml-auto rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enroll
            </button>
          )}
        </div>
      </form>

      {successOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={() => setSuccessOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-4 font-display text-xl font-bold text-ink">Enrolled!</h3>
            <p className="mt-2 text-sm text-stone">Your child has been successfully enrolled.</p>
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
