import { readContent } from '@/lib/content/store';
import { listDbChildren } from '@/lib/db/children';
import { listDbEnrollmentsByChild } from '@/lib/db/enrollments';

// Siblings discount: a family's first enrolled child (the one with the oldest
// pending/active enrollment) pays full price, every other child gets the
// admin-set percent off. Returns the percent to apply, 0 when none.
// Children not yet linked to a parent account have no known siblings.
// `percent` overrides the school-year setting (summer school has its own).
export async function getFamilyDiscountPercent(
  child: { id: string; parentId: string },
  percent?: number,
): Promise<number> {
  percent ??= (await readContent()).familyDiscountPercent;
  if (!percent || !child.parentId) return 0;

  const siblings = await listDbChildren(child.parentId);
  const firstEnrolledAt = await Promise.all(
    siblings.map(async (sibling) => {
      const active = (await listDbEnrollmentsByChild(sibling.id)).filter((e) => e.status !== 'CANCELLED');
      const times = active.map((e) => e.enrolledAt.getTime());
      return { childId: sibling.id, since: times.length ? Math.min(...times) : null };
    }),
  );

  const enrolled = firstEnrolledAt
    .filter((s): s is { childId: string; since: number } => s.since !== null)
    .sort((a, b) => a.since - b.since || a.childId.localeCompare(b.childId));

  const otherSiblingEnrolled = enrolled.some((s) => s.childId !== child.id);
  if (!otherSiblingEnrolled) return 0;
  return enrolled[0].childId === child.id ? 0 : percent;
}

export function applyDiscount(amount: number, percent: number): number {
  return Math.round(amount * (100 - percent)) / 100;
}
