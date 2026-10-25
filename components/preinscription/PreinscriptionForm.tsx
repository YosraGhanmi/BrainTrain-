'use client';

import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, School, Send } from 'lucide-react';
import PendingSubmitButton from '@/components/portal/PendingSubmitButton';
import { SCHOOL_SYSTEMS, schoolSystemLabel } from '@/lib/preinscription/school-systems';

type SubmitAction = (formData: FormData) => void | Promise<void>;

type FormValues = {
  childFullName: string;
  childAge: string;
  institution: string;
  // A course slug, or UNDECIDED
  courseSlug: string;
  schoolSystem: string;
  parentFullName: string;
  parentPhone: string;
  parentEmail: string;
  parentPhone2: string;
};

export type CourseGroupOption = {
  slug: string;
  label: string;
  minAge: number | null;
  maxAge: number | null;
  courses: { slug: string; title: string }[];
};

type Props = {
  locale: string;
  isFr: boolean;
  submitAction: SubmitAction;
  courseGroups: CourseGroupOption[];
  // Set when the form is opened from a course's "S'inscrire" button
  preselectedCourse?: string;
};

// "Not sure yet": the team advises. Not a course, so the server stores none.
const UNDECIDED = 'undecided';

const initialValues: FormValues = {
  childFullName: '',
  childAge: '',
  institution: '',
  courseSlug: '',
  schoolSystem: '',
  parentFullName: '',
  parentPhone: '',
  parentEmail: '',
  parentPhone2: '',
};

// Same rule the server applies
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_CLASS =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10';

function groupForAge(groups: CourseGroupOption[], age: string): CourseGroupOption | undefined {
  const years = Number(age);
  if (!age || !Number.isFinite(years)) return undefined;
  return groups.find((g) => g.minAge !== null && g.maxAge !== null && years >= g.minAge && years <= g.maxAge);
}

export default function PreinscriptionForm({ locale, isFr, submitAction, courseGroups, preselectedCourse = '' }: Props) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<FormValues>({ ...initialValues, courseSlug: preselectedCourse });
  const formRef = useRef<HTMLFormElement>(null);
  const optional = isFr ? '(facultatif)' : '(optional)';

  // Once the age is known only that age group's courses are offered; before
  // that (or for an age no group covers) every group is listed
  const ageGroup = groupForAge(courseGroups, values.childAge);
  const selectedCourse = courseGroups
    .flatMap((g) => g.courses.map((c) => ({ ...c, groupLabel: g.label })))
    .find((c) => c.slug === values.courseSlug);

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      // A new age can rule out the chosen course: clear it rather than keep
      // a course from another age group
      if (field === 'childAge' && next.courseSlug && next.courseSlug !== UNDECIDED) {
        const group = groupForAge(courseGroups, value);
        if (group && !group.courses.some((c) => c.slug === next.courseSlug)) next.courseSlug = '';
      }
      return next;
    });
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
        return showFieldError('childAge', isFr ? "L'âge doit être compris entre 1 et 25 ans." : 'Age must be between 1 and 25.');
      }
      if (!values.institution.trim()) return showFieldError('institution', isFr ? "Indiquez l'établissement." : 'Enter the institution.');
      if (!values.courseSlug) {
        return showFieldError('courseSlug', isFr ? 'Choisissez un cours, ou « Je ne sais pas encore ».' : 'Choose a course, or "Not sure yet".');
      }
    }

    if (step === 2) {
      if (!values.parentFullName.trim()) return showFieldError('parentFullName', isFr ? 'Indiquez votre nom complet.' : 'Enter your full name.');
      if (!values.parentPhone.trim()) return showFieldError('parentPhone', isFr ? 'Indiquez votre numéro de téléphone.' : 'Enter your phone number.');
      if (!EMAIL_PATTERN.test(values.parentEmail.trim())) {
        return showFieldError('parentEmail', isFr ? 'Indiquez une adresse e-mail valide.' : 'Enter a valid email address.');
      }
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
    { number: 1, title: isFr ? "L'enfant" : 'The child' },
    { number: 2, title: isFr ? 'Le parent' : 'The parent' },
    { number: 3, title: isFr ? 'Vérification' : 'Review' },
  ];
  const currentStep = steps[step - 1];

  const reviewRows: [string, string][] = [
    [isFr ? "Nom de l'enfant" : "Child's name", values.childFullName],
    [isFr ? 'Âge' : 'Age', values.childAge],
    [isFr ? 'Établissement' : 'Institution', values.institution],
    [
      isFr ? 'Cours souhaité' : 'Course',
      selectedCourse
        ? `${selectedCourse.title} (${selectedCourse.groupLabel})`
        : isFr
          ? "À conseiller par l'équipe"
          : 'Team to advise',
    ],
    ...(values.schoolSystem
      ? ([[isFr ? 'Système éducatif' : 'School system', schoolSystemLabel(values.schoolSystem, isFr ? 'fr' : 'en') ?? '']] as [string, string][])
      : []),
    [isFr ? 'Parent' : 'Parent', values.parentFullName],
    [isFr ? 'Téléphone' : 'Phone', values.parentPhone],
    ...(values.parentPhone2.trim()
      ? ([[isFr ? 'Autre téléphone' : 'Other phone', values.parentPhone2]] as [string, string][])
      : []),
    ['E-mail', values.parentEmail],
  ];

  return (
    <form ref={formRef} action={submitAction} onSubmit={handleSubmit} className="mt-8 rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
      <input type="hidden" name="locale" value={locale} />

      <nav aria-label={isFr ? 'Étapes du formulaire' : 'Form steps'}>
        <ol className="flex items-center justify-between gap-2">
          {steps.map((item) => {
            const complete = step > item.number;
            const active = step === item.number;
            return (
              <li key={item.number} className="min-w-0">
                <button
                  type="button"
                  onClick={() => item.number < step && setStep(item.number)}
                  disabled={item.number > step}
                  className={`flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 text-left transition sm:gap-3 ${complete ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                      active || complete ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : item.number}
                  </span>
                  {/* On phones only the current step is named; the caption
                      under the bar names it too */}
                  <span
                    className={`truncate text-sm font-semibold transition-colors ${active ? 'text-ink' : complete ? 'hidden text-stone sm:inline' : 'hidden text-slate-400 sm:inline'}`}
                  >
                    {item.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={step}
          aria-label={isFr ? 'Progression' : 'Progress'}
        >
          <div className="h-full rounded-full bg-brand-red transition-[width] duration-500 ease-out" style={{ width: `${(step / steps.length) * 100}%` }} />
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          {isFr ? 'Étape' : 'Step'} {step} / {steps.length} — {currentStep.title}
        </p>
      </nav>

      <div className="mt-8 border-t border-ink/10 pt-8">
        <fieldset data-step="1" hidden={step !== 1} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">
            {isFr ? 'À propos de votre enfant' : 'About your child'}
          </legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? 'Quelques informations pour mieux vous accompagner.' : 'A few details will help us guide your family.'}
          </p>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? "Nom et prénom de l'enfant" : "Child's full name"}</span>
            <input
              name="childFullName"
              required
              value={values.childFullName}
              onChange={(event) => updateValue('childFullName', event.target.value)}
              autoComplete="name"
              className={INPUT_CLASS}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Âge' : 'Age'}</span>
              <input
                name="childAge"
                required
                type="number"
                min="1"
                max="25"
                inputMode="numeric"
                value={values.childAge}
                onChange={(event) => updateValue('childAge', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Établissement' : 'Institution'}</span>
              <input
                name="institution"
                required
                autoComplete="organization"
                value={values.institution}
                onChange={(event) => updateValue('institution', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Cours souhaité' : 'Course of interest'}</span>
            <span className="relative block">
              <BookOpen className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <select
                name="courseSlug"
                required
                value={values.courseSlug}
                onChange={(event) => updateValue('courseSlug', event.target.value)}
                className={`${INPUT_CLASS} cursor-pointer appearance-none pl-11 pr-11 ${values.courseSlug ? 'text-ink' : 'text-stone'}`}
              >
                {/* Shown in the closed box until a choice is made, but
                    `hidden` keeps it out of the open list */}
                <option value="" disabled hidden>
                  {isFr ? 'Choisir un cours' : 'Choose a course'}
                </option>
                {ageGroup
                  ? ageGroup.courses.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))
                  : // Age not known yet: several groups share course names,
                    // so each group keeps its heading
                    courseGroups.map((group) => (
                      <optgroup key={group.slug} label={group.label}>
                        {group.courses.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                <option value={UNDECIDED}>{isFr ? 'Je ne sais pas encore, conseillez-moi' : 'Not sure yet, please advise me'}</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
            </span>
            {!ageGroup ? (
              <span className="mt-2 block text-xs text-stone">
                {isFr ? "Indiquez l'âge de l'enfant pour voir les cours de son groupe." : "Enter the child's age to see the courses for their group."}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">
              {isFr ? "Système éducatif de l'enfant" : "Child's school system"}{' '}
              <span className="font-normal text-stone">{optional}</span>
            </span>
            <span className="relative block">
              <School className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
              <select
                name="schoolSystem"
                value={values.schoolSystem}
                onChange={(event) => updateValue('schoolSystem', event.target.value)}
                className={`${INPUT_CLASS} cursor-pointer appearance-none pl-11 pr-11 ${values.schoolSystem ? 'text-ink' : 'text-stone'}`}
              >
                <option value="">{isFr ? 'Choisir (facultatif)' : 'Choose (optional)'}</option>
                {SCHOOL_SYSTEMS.map((system) => (
                  <option key={system.code} value={system.code}>
                    {isFr ? system.fr : system.en}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" aria-hidden="true" />
            </span>
          </label>
        </fieldset>

        <fieldset data-step="2" hidden={step !== 2} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">{isFr ? 'Comment vous contacter' : 'How we can reach you'}</legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? 'Notre équipe utilisera ces coordonnées pour vous rappeler.' : 'Our team will use these details to call you back.'}
          </p>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Nom et prénom du parent' : "Parent's full name"}</span>
            <input
              name="parentFullName"
              required
              value={values.parentFullName}
              onChange={(event) => updateValue('parentFullName', event.target.value)}
              autoComplete="name"
              className={INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Adresse e-mail' : 'Email address'}</span>
            <input
              name="parentEmail"
              required
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.parentEmail}
              onChange={(event) => updateValue('parentEmail', event.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">{isFr ? 'Numéro de téléphone' : 'Phone number'}</span>
              <input
                name="parentPhone"
                required
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={values.parentPhone}
                onChange={(event) => updateValue('parentPhone', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ink">
                {isFr ? 'Autre numéro' : 'Other phone number'} <span className="font-normal text-stone">{optional}</span>
              </span>
              <input
                name="parentPhone2"
                type="tel"
                inputMode="tel"
                value={values.parentPhone2}
                onChange={(event) => updateValue('parentPhone2', event.target.value)}
                className={INPUT_CLASS}
              />
            </label>
          </div>
        </fieldset>

        <fieldset data-step="3" hidden={step !== 3} className="space-y-5">
          <legend className="font-display text-xl font-semibold text-ink">{isFr ? 'Vérifiez vos informations' : 'Review your information'}</legend>
          <p className="text-sm leading-relaxed text-stone">
            {isFr ? "Tout est correct ? Envoyez votre demande à l'équipe BrainTrain." : 'Everything look right? Send your request to the BrainTrain team.'}
          </p>
          <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-slate-50">
            {reviewRows.map(([label, value]) => (
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
        ) : null}

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
