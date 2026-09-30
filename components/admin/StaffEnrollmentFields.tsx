'use client';

import { useEffect, useRef, useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type StaffEnrollmentOptions = {
  ageGroups: Array<{ slug: string; label: string }>;
  courses: Array<{ slug: string; title: string; ageGroupSlug: string }>;
  timeSlots: Array<{ id: string; label: string; dayOfWeek: number; startTime: string; endTime: string }>;
  sessions: Array<{ courseSlug: string; dayOfWeek: number; startTime: string; endTime: string; seatsLeft: number }>;
};

const selectClassName =
  'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50';
const labelClassName = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone';

// Course + timetable slot + plan + method + "already paid?" for staff
// entering an enrollment. The group for that course and slot is reused if it
// exists, or created on save. Courses of the child's age group are listed
// first; the age group comes from the prop, or else from the surrounding
// form's ageGroupSlug field (the new-child wizard detects it in step 1).
export default function StaffEnrollmentFields({
  options,
  ageGroupSlug: ageGroupProp,
  optional = false,
}: {
  options: StaffEnrollmentOptions;
  ageGroupSlug?: string;
  optional?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [formAgeGroup, setFormAgeGroup] = useState('');
  const [courseSlug, setCourseSlug] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const ageGroupSlug = ageGroupProp ?? formAgeGroup;

  useEffect(() => {
    if (ageGroupProp !== undefined) return;
    const form = rootRef.current?.closest('form');
    if (!form) return;
    // Runs after React has re-rendered the field that changed
    const read = () =>
      setTimeout(() => {
        const input = form.elements.namedItem('ageGroupSlug');
        setFormAgeGroup(input instanceof HTMLInputElement || input instanceof HTMLSelectElement ? input.value : '');
      }, 0);
    read();
    form.addEventListener('input', read);
    form.addEventListener('change', read);
    return () => {
      form.removeEventListener('input', read);
      form.removeEventListener('change', read);
    };
  }, [ageGroupProp]);

  const ageGroupLabel = new Map(options.ageGroups.map((g) => [g.slug, g.label]));
  const orderedGroups = [...options.ageGroups].sort((a, b) => Number(b.slug === ageGroupSlug) - Number(a.slug === ageGroupSlug));

  const groupFor = (slot: StaffEnrollmentOptions['timeSlots'][number]) =>
    options.sessions.find(
      (s) =>
        s.courseSlug === courseSlug && s.dayOfWeek === slot.dayOfWeek && s.startTime === slot.startTime && s.endTime === slot.endTime,
    );

  const enrolling = Boolean(courseSlug);
  const courseAgeGroup = options.courses.find((c) => c.slug === courseSlug)?.ageGroupSlug;

  return (
    <div ref={rootRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={labelClassName}>Course</span>
        <select
          name="courseSlug"
          required={!optional}
          value={courseSlug}
          onChange={(e) => {
            setCourseSlug(e.target.value);
            setTimeSlotId('');
          }}
          className={selectClassName}
        >
          <option value="">{optional ? 'Skip, enroll later' : 'Pick a course…'}</option>
          {orderedGroups.map((g) => {
            const courses = options.courses.filter((c) => c.ageGroupSlug === g.slug);
            if (courses.length === 0) return null;
            return (
              <optgroup key={g.slug} label={g.slug === ageGroupSlug ? `${g.label} (child's age group)` : g.label}>
                {courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </label>

      <label className="block">
        <span className={labelClassName}>Time slot</span>
        <select
          name="timeSlotId"
          required={enrolling}
          disabled={!enrolling}
          value={timeSlotId}
          onChange={(e) => setTimeSlotId(e.target.value)}
          className={selectClassName}
        >
          <option value="">{enrolling ? 'Pick a time slot…' : 'Pick a course first'}</option>
          {options.timeSlots.map((slot) => {
            const group = groupFor(slot);
            const full = group ? group.seatsLeft <= 0 : false;
            const status = !group ? 'new group' : full ? 'full' : `${group.seatsLeft} seats left`;
            return (
              <option key={slot.id} value={slot.id} disabled={full}>
                {slot.label} · {DAYS[slot.dayOfWeek]} {slot.startTime}-{slot.endTime} · {status}
              </option>
            );
          })}
        </select>
        {enrolling && options.timeSlots.length === 0 ? (
          <span className="mt-1 block text-xs font-semibold text-amber-700">No time slots yet: add them on the Time slots page.</span>
        ) : null}
      </label>

      <fieldset disabled={!enrolling} className="contents">
        <label className="block">
          <span className={labelClassName}>Plan</span>
          <select name="planType" defaultValue="MONTHLY" className={selectClassName}>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">3 months</option>
            <option value="YEARLY">Full year</option>
          </select>
        </label>

        <label className="block">
          <span className={labelClassName}>Payment method</span>
          <select name="paymentMethod" defaultValue="CASH" className={selectClassName}>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className={labelClassName}>Current period</span>
          <select name="paymentStatus" defaultValue="PAID" className={selectClassName}>
            <option value="PAID">Already paid</option>
            <option value="PENDING">Not paid yet (parent will get payment alerts)</option>
          </select>
        </label>
      </fieldset>

      {courseAgeGroup && ageGroupSlug && courseAgeGroup !== ageGroupSlug ? (
        <p className="text-xs font-semibold text-amber-700 sm:col-span-2">
          {`This course is for ${ageGroupLabel.get(courseAgeGroup) ?? 'another age group'}, not the child's age group. Staff can still enroll them.`}
        </p>
      ) : null}
    </div>
  );
}
