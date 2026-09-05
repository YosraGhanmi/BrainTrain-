import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getPortalSessionUser } from '@/lib/portal-auth/session';

export type AdminSessionInfo =
  | { kind: 'admin' }
  | { kind: 'secretary'; fullName: string; email: string };

// Two independent auth mechanisms share the admin panel:
//  - the single env-configured Admin, via the legacy stateless HMAC cookie
//  - real Secretary accounts (User rows, role SECRETARY), via the same
//    DB-backed portal session parents/teachers use — so freezing/deleting a
//    secretary account from /admin/secretaries takes effect immediately.
export async function getAdminSession(): Promise<AdminSessionInfo | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) return { kind: 'admin' };

  const user = await getPortalSessionUser();
  if (user && user.role === 'SECRETARY') {
    return { kind: 'secretary', fullName: user.fullName, email: user.email };
  }

  return null;
}

export async function requireAdmin(): Promise<AdminSessionInfo> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}
