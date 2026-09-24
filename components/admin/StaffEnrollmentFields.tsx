import { getCourseEntryOrThrow, listAgeGroupEntries } from '@/lib/content/lookup';
import { listTimeSlots, findSlotLabel } from '@/lib/scheduling/time-slots';
import { listAllFirebaseSessionsWithCounts } from '@/lib/firebase/read-models';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type GroupOption = { id: string; label: string; ageGroupSlug: string; full: boolean };

// Every scheduled group, labelled "Course · Group (term) · N left"
export async function listGroupOptions(): Promise<GroupOption[]> {
  const [sessions, timeSlots] = await Promise.all([listAllFirebaseSessionsWithCounts(), listTimeSlots()]);
  return sessions
    .map((s) => {
      const course = getCourseEntryOrThrow(s.courseSlug);
      const group = findSlotLabel(timeSlots, s.dayOfWeek, s.startTime, s.endTime) ?? `${DAYS[s.dayOfWeek]} ${s.startTime}-${s.endTime}`;
      const seatsLeft = s.capacity - s.enrollmentCount;
      return {
        id: s.id,
        label: `${course.title.en} · ${group}${s.term ? ` (${s.term})` : ''} · ${seatsLeft <= 0 ? 'Full' : `${seatsLeft} left`}`,
        ageGroupSlug: course.ageGroupSlug,
        full: seatsLeft <= 0,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

const selectClassName = 'w-full rounded-xl border border-ink/10 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-accent';

// Group + plan + method + "already paid?" for staff entering an enrollment.
export default function StaffEnrollmentFields({ groups, optional = false }: { groups: GroupOption[]; optional?: boolean }) {
  const ageGroupLabel = new Map(listAgeGroupEntries().map((g) => [g.slug, g.label.en]));
  const byAgeGroup = new Map<string, GroupOption[]>();
  for (const g of groups) byAgeGroup.set(g.ageGroupSlug, [...(byAgeGroup.get(g.ageGroupSlug) ?? []), g]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Group</span>
        <select name="courseSessionId" required={!optional} defaultValue="" className={selectClassName}>
          <option value="">{optional ? 'Not enrolled this year' : 'Pick a group…'}</option>
          {[...byAgeGroup.entries()].map(([slug, options]) => (
            <optgroup key={slug} label={ageGroupLabel.get(slug) ?? slug}>
              {options.map((o) => (
                <option key={o.id} value={o.id} disabled={o.full}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Plan</span>
        <select name="planType" defaultValue="MONTHLY" className={selectClassName}>
          <option value="MONTHLY">Monthly</option>
          <option value="QUARTERLY">3 months</option>
          <option value="YEARLY">Full year</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Payment method</span>
        <select name="paymentMethod" defaultValue="CASH" className={selectClassName}>
          <option value="CASH">Cash</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CARD">Card</option>
        </select>
      </label>

      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone">Current period</span>
        <select name="paymentStatus" defaultValue="PAID" className={selectClassName}>
          <option value="PAID">Already paid</option>
          <option value="PENDING">Not paid yet (parent will get payment alerts)</option>
        </select>
      </label>
    </div>
  );
}
