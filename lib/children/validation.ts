import { ageOn } from '@/lib/content/age-range';

// Limits on what can be recorded for a child, shared by the staff forms, the
// Excel import and the parent portal (pure, so forms can check as you type).

// BrainTrain takes children from 4 to 18 years old (age today)
export const CHILD_MIN_AGE = 4;
export const CHILD_MAX_AGE = 18;
// Children's and parents' names
export const NAME_MAX_LENGTH = 30;

const iso = (date: Date) => date.toISOString().slice(0, 10);
const utcToday = (today: Date) => new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

// The range of birth dates allowed today, as yyyy-mm-dd for <input type="date">:
// born at most 18 years ago (the day before turning 19) and at least 4 years ago
export function birthDateBounds(today: Date = new Date()): { min: string; max: string } {
  const t = utcToday(today);
  const latest = new Date(Date.UTC(t.getUTCFullYear() - CHILD_MIN_AGE, t.getUTCMonth(), t.getUTCDate()));
  const earliest = new Date(Date.UTC(t.getUTCFullYear() - CHILD_MAX_AGE - 1, t.getUTCMonth(), t.getUTCDate() + 1));
  return { min: iso(earliest), max: iso(latest) };
}

export type BirthDateProblem = { kind: 'tooYoung' | 'tooOld'; age: number };

// null when the child's age today is within 4 to 18
export function birthDateProblem(dateOfBirth: Date, today: Date = new Date()): BirthDateProblem | null {
  const age = ageOn(dateOfBirth, utcToday(today));
  if (age < CHILD_MIN_AGE) return { kind: 'tooYoung', age };
  if (age > CHILD_MAX_AGE) return { kind: 'tooOld', age };
  return null;
}

export function birthDateProblemText(problem: BirthDateProblem): string {
  const age = Math.max(problem.age, 0);
  return problem.kind === 'tooYoung'
    ? `This date makes the child ${age} years old: children must be at least ${CHILD_MIN_AGE}.`
    : `This date makes the child ${age} years old: children must be ${CHILD_MAX_AGE} or younger.`;
}

export function nameTooLong(name: string | null | undefined): boolean {
  return (name ?? '').trim().length > NAME_MAX_LENGTH;
}
