import crypto from 'crypto';

// Node's crypto module (not Edge-compatible), so this file is only ever
// imported from Server Components / Server Actions / Route Handlers — never
// from middleware, which runs on the Edge runtime.
export const SESSION_COOKIE_NAME = 'braintrain_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

function sign(payload: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
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
  if (!getSecret()) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return false;

  const expectedSig = sign(encoded);
  if (!expectedSig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}
