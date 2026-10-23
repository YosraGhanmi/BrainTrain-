import { withReturnPath } from '@/lib/portal-auth/return-path';

// Where a course's "S'inscrire" button goes, following the admin setting
// that routes register buttons to the preinscription form: the form with
// this course already chosen, or (setting off) the parent account sign-up,
// which links back to `from`.
export function courseRegisterHref(routeToForm: boolean, courseSlug: string, from: string): string {
  return routeToForm
    ? `/preinscription?course=${encodeURIComponent(courseSlug)}`
    : withReturnPath('/parent-portal/register', from);
}
