import { cookies } from 'next/headers';

// Which child the parent-portal topbar switcher currently has selected.
// Cookie-based (not a URL param) so every tab — dashboard, courses,
// schedule, payments — can filter to the same child without each page
// having to thread a childId through its own route.
export const SELECTED_CHILD_COOKIE = 'portal_selected_child';

export function resolveSelectedChild<T extends { id: string }>(children: T[]): T | null {
  if (children.length === 0) return null;
  const raw = cookies().get(SELECTED_CHILD_COOKIE)?.value;
  return children.find((c) => c.id === raw) ?? children[0];
}
