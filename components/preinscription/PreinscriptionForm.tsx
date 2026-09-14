'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';

type SubmitAction = (formData: FormData) => void | Promise<void>;

type FormValues = {
  childFullName: string;
  childAge: string;
  institution: string;
  parentFullName: string;
  parentPhone: string;
};

type Props = {
  locale: string;
  isFr: boolean;
  submitAction: SubmitAction;
};

const initialValues: FormValues = {
  childFullName: '',
  childAge: '',
  institution: '',
  parentFullName: '',
  parentPhone: '',
};

export default function PreinscriptionForm({ locale, isFr, submitAction }: Props) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const showFieldError = (fieldName: keyof FormValues, message: string) => {
    const field = formRef.current?.querySelector<HTMLInputElement>(`[name="${fieldName}"]`);
    if (!field) return false;
    field.setCustomValidity(message);
    field.reportValidity();
    field.setCustomValidity('');
    field.focus();
    return false;
  };

  const validateCurrentStep = () => {
    if (step === 1) {
      if (!values.childFullName.trim()) return showFieldError('childFullName', isFr ? "Indiquez le nom de l'enfant." : "Enter the child's full name.");
      if (!values.childAge || Number(values.childAge) < 1 || Number(values.childAge) > 25) {
        return showFieldError('childAge', isFr ? "L'age doit etre compris entre 1 et 25 ans." : 'Age must be between 1 and 25.');
      }
      if (!values.institution.trim()) return showFieldError('institution', isFr ? "Indiquez l'etablissement." : 'Enter the institution.');
    }

    if (step === 2) {
      if (!values.parentFullName.trim()) return showFieldError('parentFullName', isFr ? 'Indiquez votre nom complet.' : 'Enter your full name.');
      if (!values.parentPhone.trim()) return showFieldError('parentPhone', isFr ? 'Indiquez votre numero de telephone.' : 'Enter your phone number.');
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) setStep((current) => Math.min(current + 1, 3));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!validateCurrentStep()) {
      event.preventDefault();
    }
  };

  const steps = [
    {
      number: 1,
      title: isFr ? 'Enfant' : 'Child',
      detail: isFr ? 'Ses informations' : 'Their details',
      color: 'bg-blue-600',
      soft: 'bg-blue-50 text-blue-700 ring-blue-200',
    },
    {
      number: 2,
      title: isFr ? 'Parent' : 'Parent',
      detail: isFr ? 'Vos coordonnees' : 'Your contact',
      color: 'bg-emerald-600',
      soft: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    },
    {
      number: 3,
      title: isFr ? 'Verifier' : 'Review',
      detail: isFr ? "Avant l'envoi" : 'Before sending',
      color: 'bg-orange-500',
      soft: 'bg-orange-50 text-orange-700 ring-orange-200',
    },
  ];

  return (
    <form ref={formRef} action={submitAction} onSubmit={handleSubmit} className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <input type="hidden" name="locale" value={locale} />

      <nav aria-label={isFr ? 'Etapes du formulaire' : 'Form steps'}>
        <ol className="grid grid-cols-3 gap-2 sm:gap-4">
          {steps.map((item) => {
            const complete = step > item.number;
            const active = step === item.number;
            return (
              <li key={item.number} className="relative">
                {item.number < 3 ? <span className={`absolute left-[calc(50%+1.25rem)] right-[calc(-50%-0.25rem)] top-5 hidden h-px sm:block ${step > item.number ? item.color : 'bg-slate-200'}`} aria-hidden="true" /> : null}
                <button
                  type="button"
                  onClick={() => item.number < step && setStep(item.number)}
                  disabled={item.number > step}
                    className={`relative z-10 flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left transition sm:px-3 ${active ? `${item.soft} ring-1` : complete ? 'bg-slate-50' : 'bg-transparent'} ${item.number < step ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition ${complete || active ? item.color : 'bg-slate-200 text-slate-500'}`}>
                    {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : item.number}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-bold ${active ? 'text-ink' : 'text-stone'}`}>{item.title}</span>
                    <span className="hidden truncate text-xs text-stone sm:block">{item.detail}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-8 border-t border-ink/10 pt-8">
        <fieldset data-step="1" hidden={step !== 1} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">
            {isFr ? 'A propos de votre enfant' : 'About your child'}
          </legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? 'Quelques informations pour mieux vous accompagner.' : 'A few details will help us guide your family.'}
          </p>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? "Nom et prenom d'enfant" : "Child's full name"}</span>
            <input
              name="childFullName"
              required
              value={values.childFullName}
              onChange={(event) => updateValue('childFullName', event.target.value)}
              autoComplete="name"
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Age' : 'Age'}</span>
              <input
                name="childAge"
                required
                type="number"
                min="1"
                max="25"
                inputMode="numeric"
                value={values.childAge}
                onChange={(event) => updateValue('childAge', event.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Etablissement' : 'Institution'}</span>
              <input
                name="institution"
                required
                autoComplete="organization"
                value={values.institution}
                onChange={(event) => updateValue('institution', event.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              />
            </label>
          </div>
        </fieldset>

        <fieldset data-step="2" hidden={step !== 2} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">{isFr ? 'Comment vous contacter' : 'How we can reach you'}</legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? 'Notre equipe utilisera ces coordonnees pour vous rappeler.' : 'Our team will use these details to call you back.'}
          </p>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Nom et prenom du parent' : "Parent's full name"}</span>
            <input
              name="parentFullName"
              required
              value={values.parentFullName}
              onChange={(event) => updateValue('parentFullName', event.target.value)}
              autoComplete="name"
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Numero de telephone du parent' : "Parent's phone number"}</span>
            <input
              name="parentPhone"
              required
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={values.parentPhone}
              onChange={(event) => updateValue('parentPhone', event.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
            />
          </label>
        </fieldset>

        <fieldset data-step="3" hidden={step !== 3} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">{isFr ? 'Verifier vos informations' : 'Review your information'}</legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? 'Tout est correct ? Envoyez votre demande a l equipe BrainTrain.' : 'Everything look right? Send your request to the BrainTrain team.'}
          </p>
          <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-slate-50">
            {[
              [isFr ? "Nom de l'enfant" : "Child's name", values.childFullName],
              [isFr ? 'Age' : 'Age', values.childAge],
              [isFr ? 'Etablissement' : 'Institution', values.institution],
              [isFr ? 'Parent' : 'Parent', values.parentFullName],
              [isFr ? 'Telephone' : 'Phone', values.parentPhone],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-xs font-bold uppercase tracking-wide text-stone">{label}</span>
                <span className="break-words text-sm font-semibold text-ink sm:text-right">{value}</span>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-ink/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:border-accent hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent/20">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {isFr ? 'Retour' : 'Back'}
          </button>
        ) : (
          <span className="text-xs text-stone">{isFr ? 'Etape 1 sur 3' : 'Step 1 of 3'}</span>
        )}

        {step < 3 ? (
          <button type="button" onClick={handleNext} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-accent focus:outline-none focus:ring-4 focus:ring-accent/20 sm:ml-auto">
            {isFr ? 'Continuer' : 'Continue'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <PendingSubmitButton pendingLabel={isFr ? 'Envoi...' : 'Sending...'} className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 sm:ml-auto">
            {isFr ? 'Envoyer ma demande' : 'Send my request'}
            <Send className="h-4 w-4" aria-hidden="true" />
          </PendingSubmitButton>
        )}
      </div>
    </form>
  );
}
