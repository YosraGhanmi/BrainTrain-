import { resolveFirebasePrice } from '@/lib/firebase/pricing';

// Resolves a course-specific override if the course opted into one, else the
// price its age group defaults to. Delegates to the Firebase pricing module.
export async function resolvePrice(
  planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  courseSlug: string,
  ageGroupSlug: string,
): Promise<{ amount: number; currency: string }> {
  return resolveFirebasePrice(planType, courseSlug, ageGroupSlug);
}
