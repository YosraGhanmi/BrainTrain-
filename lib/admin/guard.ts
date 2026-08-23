import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

// Plain server-only helper — NOT a Server Action, so it can stay a sync
// function. A 'use server' file requires every export to be an async
// function (that's the whole file's contract for Next.js), which is why this
// lives outside lib/admin/actions.ts even though every action calls it.
export function requireAdmin(): void {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) redirect('/admin/login');
}
