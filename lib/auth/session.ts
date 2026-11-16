import crypto from 'crypto';
import { signToken, verifyToken } from '@/lib/auth/signed-token';

// Node's crypto module (not Edge-compatible), so this file is only ever
// imported from Server Components / Server Actions / Route Handlers — never
// from middleware, which runs on the Edge runtime.
export const SESSION_COOKIE_NAME = 'braintrain_admin_session';
// Stateless, so it can't be revoked before it expires: kept short
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function envValue(name: 'ADMIN_SESSION_SECRET' | 'ADMIN_PASSWORD' | 'ADMIN_EMAIL'): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getSecret(): string | null {
  return envValue('ADMIN_SESSION_SECRET');
}

function getAdminPassword(): string | null {
  return envValue('ADMIN_PASSWORD');
}

function getAdminEmail(): string | null {
  return envValue('ADMIN_EMAIL');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkCredentials(email: string, password: string): boolean {
  const configuredEmail = getAdminEmail();
  const configuredPassword = getAdminPassword();
  if (!configuredEmail || !configuredPassword || !getSecret()) return false;

  const emailOk = timingSafeStringEqual(email.trim().toLowerCase(), configuredEmail.trim().toLowerCase());
  const passwordOk = timingSafeStringEqual(password, configuredPassword);
  return emailOk && passwordOk;
}

export function createSessionToken(): string {
  return signToken('admin-session', {}, SESSION_TTL_MS);
}

export function verifySessionToken(token: string | undefined | null): boolean {
  return verifyToken('admin-session', token) !== null;
}
