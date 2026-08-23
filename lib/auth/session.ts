import crypto from 'crypto';

// Node's crypto module (not Edge-compatible), so this file is only ever
// imported from Server Components / Server Actions / Route Handlers — never
// from middleware, which runs on the Edge runtime.
export const SESSION_COOKIE_NAME = 'braintrain_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

let warnedSecret = false;
let warnedPassword = false;
let warnedEmail = false;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;
  if (!warnedSecret) {
    console.warn(
      '[admin] ADMIN_SESSION_SECRET is not set — using an insecure default. Set it in your environment before deploying.'
    );
    warnedSecret = true;
  }
  return 'braintrain-dev-secret-change-me';
}

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  if (!warnedPassword) {
    console.warn(
      '[admin] ADMIN_PASSWORD is not set — using the insecure default "braintrain-admin". Set it in your environment before deploying.'
    );
    warnedPassword = true;
  }
  return 'braintrain-admin';
}

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (email) return email;
  if (!warnedEmail) {
    console.warn(
      '[admin] ADMIN_EMAIL is not set — using the insecure default "admin@braintrain.tn". Set it in your environment before deploying.'
    );
    warnedEmail = true;
  }
  return 'admin@braintrain.tn';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkCredentials(email: string, password: string): boolean {
  const emailOk = timingSafeStringEqual(email.trim().toLowerCase(), getAdminEmail().trim().toLowerCase());
  const passwordOk = timingSafeStringEqual(password, getAdminPassword());
  return emailOk && passwordOk;
}

export function createSessionToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return false;

  const expectedSig = sign(encoded);
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
