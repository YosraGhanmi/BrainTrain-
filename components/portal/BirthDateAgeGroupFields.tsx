'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { detectAgeGroupSlug, schoolYearAge, type AgeRange } from '@/lib/content/age-range';

export type AgeGroupOption = AgeRange & { label: string };

// Date of birth + the age group it puts the child in. The group is detected
// live and submitted as a hidden field; a manual picker only appears when no
// group covers the child's age. The server re-detects on save either way.
export default function BirthDateAgeGroupFields({
  groups,
  defaultDateOfBirth = '',
  defaultAgeGroupSlug = '',
  labels,
  fieldClassName = 'block',
  labelClassName,
  inputClassName,
}: {
  groups: AgeGroupOption[];
  defaultDateOfBirth?: string;
  defaultAgeGroupSlug?: string;
  labels: {
    dateOfBirth: string;
    ageGroup: string;
    // Shown before a date is entered
    empty: string;
    // Under the detected group, e.g. "Age {age} this school year · updates automatically"
    detected: string;
    // Above the fallback picker, e.g. "No age group for age {age}, pick one"
    noMatch: string;
    select: string;
  };
  fieldClassName?: string;
  labelClassName: string;
  inputClassName: string;
}) {
  const [dateOfBirth, setDateOfBirth] = useState(defaultDateOfBirth);
  const date = new Date(dateOfBirth);
  const hasDate = Boolean(dateOfBirth) && !Number.isNaN(date.getTime());
  const detectedSlug = hasDate ? detectAgeGroupSlug(groups, date) : null;
  const detected = groups.find((g) => g.slug === detectedSlug);
  const age = hasDate ? schoolYearAge(date) : null;

  return (
    <>
      <label className={fieldClassName}>
        <span className={labelClassName}>{labels.dateOfBirth}</span>
        <input
          name="dateOfBirth"
          type="date"
          required
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className={inputClassName}
        />
      </label>

      <div className={fieldClassName}>
        <span className={labelClassName}>{labels.ageGroup}</span>
        {detected ? (
          <>
            <input type="hidden" name="ageGroupSlug" value={detected.slug} />
            <div className={`${inputClassName} flex items-center gap-2`} aria-live="polite">
              <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              <span className="font-semibold text-ink">{detected.label}</span>
            </div>
            <p className="mt-1 text-xs text-stone">{labels.detected.replace('{age}', String(age))}</p>
          </>
        ) : hasDate ? (
          <>
            <select name="ageGroupSlug" required defaultValue={defaultAgeGroupSlug} className={inputClassName}>
              <option value="">{labels.select}</option>
              {groups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs font-semibold text-amber-700">{labels.noMatch.replace('{age}', String(age))}</p>
          </>
        ) : (
          <div className={`${inputClassName} text-stone/70`}>{labels.empty}</div>
        )}
      </div>
    </>
  );
}
