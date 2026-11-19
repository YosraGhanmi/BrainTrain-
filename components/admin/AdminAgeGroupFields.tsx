'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ageGroupFit, detectAgeGroupSlug, schoolYearAge } from '@/lib/content/age-range';
import { birthDateBounds, birthDateProblem, birthDateProblemText } from '@/lib/children/validation';
import type { AgeGroupOption } from '@/components/portal/BirthDateAgeGroupFields';

// Staff version of the date of birth + age group fields. Both are optional:
// the group follows the date of birth ("Automatic"), can be picked by hand
// for any age (a child of 3 or 19 included, with a warning rather than a
// refusal), or left to complete when neither is known.
export default function AdminAgeGroupFields({
  groups,
  defaultDateOfBirth = '',
  defaultAgeGroupSlug = '',
  defaultManual = false,
  labelClassName,
  inputClassName,
}: {
  groups: AgeGroupOption[];
  defaultDateOfBirth?: string;
  defaultAgeGroupSlug?: string;
  defaultManual?: boolean;
  labelClassName: string;
  inputClassName: string;
}) {
  const [dateOfBirth, setDateOfBirth] = useState(defaultDateOfBirth);
  // "" = automatic. A child with no date keeps the group it has, as a pick.
  const [picked, setPicked] = useState(defaultManual || !defaultDateOfBirth ? defaultAgeGroupSlug : '');

  const date = dateOfBirth ? new Date(dateOfBirth) : null;
  const hasDate = date !== null && !Number.isNaN(date.getTime());
  // Children are 4 to 18. A date already on record isn't held against an
  // edit (the child may have aged out since); a newly typed one is.
  const changed = dateOfBirth !== defaultDateOfBirth;
  const dateProblem = hasDate && changed ? birthDateProblem(date) : null;
  const dateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    dateRef.current?.setCustomValidity(dateProblem ? birthDateProblemText(dateProblem) : '');
  }, [dateProblem]);
  const [bounds] = useState(() => birthDateBounds());
  const detected = hasDate ? groups.find((g) => g.slug === detectAgeGroupSlug(groups, date)) : undefined;
  const age = hasDate ? schoolYearAge(date) : null;
  const pickedGroup = groups.find((g) => g.slug === picked);
  const fit = pickedGroup && hasDate ? ageGroupFit(pickedGroup, date) : null;

  let note: { text: string; warn: boolean } | null = null;
  if (dateProblem) {
    // The date itself is refused (shown under it): no group advice until fixed
    note = null;
  } else if (pickedGroup) {
    if (pickedGroup.slug === detected?.slug) {
      note = { text: `Age ${age} this school year: same as automatic, so it will keep following the date of birth.`, warn: false };
    } else if (fit && !fit.fits) {
      note = { text: `Age ${fit.age} this school year, outside this group's ages. It will be saved anyway.`, warn: true };
    } else {
      note = { text: hasDate ? 'Picked by hand: stays until changed here.' : 'Picked by hand.', warn: false };
    }
  } else if (detected) {
    note = { text: `Age ${age} this school year · updates automatically`, warn: false };
  } else if (hasDate) {
    note = { text: `No age group covers age ${age}: pick one, or leave it to complete.`, warn: true };
  } else {
    note = { text: 'Without a date of birth, pick a group or leave it to complete.', warn: false };
  }

  return (
    <>
      <label className="block">
        <span className={labelClassName}>Date of birth (optional)</span>
        <input
          ref={dateRef}
          name="dateOfBirth"
          type="date"
          value={dateOfBirth}
          min={changed ? bounds.min : undefined}
          max={changed ? bounds.max : undefined}
          aria-invalid={dateProblem ? true : undefined}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={`${inputClassName} ${dateProblem ? 'border-red-300 focus:border-red-400' : ''}`}
        />
        {dateProblem ? (
          <span className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-red-600">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            {birthDateProblemText(dateProblem)}
          </span>
        ) : null}
      </label>

      {/* The group in effect (picked, else detected), for other fields of the
          form such as the course picker. Not read by the server. */}
      <input type="hidden" name="effectiveAgeGroupSlug" value={pickedGroup?.slug ?? detected?.slug ?? ''} />
      <label className="block">
        <span className={labelClassName}>Age group</span>
        <select name="ageGroupSlug" value={picked} onChange={(e) => setPicked(e.target.value)} className={inputClassName}>
          <option value="">{detected ? `Automatic: ${detected.label}` : 'To complete'}</option>
          {groups.map((g) => (
            <option key={g.slug} value={g.slug}>
              {g.label}
            </option>
          ))}
        </select>
        {note ? (
          <span
            aria-live="polite"
            className={`mt-1 flex items-start gap-1.5 text-xs ${note.warn ? 'font-semibold text-amber-700' : 'text-stone'}`}
          >
            {note.warn ? <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" /> : null}
            {note.text}
          </span>
        ) : null}
      </label>
    </>
  );
}
