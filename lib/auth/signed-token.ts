import crypto from 'crypto';

// Small signed tokens kept in cookies (the admin session, and the short
// "password accepted, second step pending" cookies). Every token carries what
// it is for, and that purpose is part of what gets signed, so a token made
// for one use is never accepted for another, even when two purposes share a
// secret.
export type TokenPurpose = 'admin-session' | 'teacher-pending' | 'parent-2fa-pending';

function secretFor(purpose: TokenPurpose): string | null {
  const admin = process.env.ADMIN_SESSION_SECRET?.trim() || null;
  if (purpose === 'admin-session') return admin;
  // The portal's own secret when it is set; the purpose prefix below keeps
  // the tokens apart either way.
  return process.env.PORTAL_SESSION_SECRET?.trim() || admin;
}

function mac(purpose: TokenPurpose, encoded: string): Buffer | null {
  const secret = secretFor(purpose);
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(`${purpose}.${encoded}`).digest();
}

export function signToken(purpose: TokenPurpose, claims: Record<string, unknown>, ttlMs: number): string {
  const encoded = Buffer.from(JSON.stringify({ ...claims, purpose, exp: Date.now() + ttlMs })).toString('base64url');
  const signature = mac(purpose, encoded);
  if (!signature) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  return `${encoded}.${signature.toString('base64url')}`;
}

// The token's claims, or null when it is missing, forged, expired or was
// issued for another purpose
export function verifyToken(purpose: TokenPurpose, token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [encoded, signature] = parts;

  const expected = mac(purpose, encoded);
  if (!expected) return null;
  const given = Buffer.from(signature, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
    if (!claims || typeof claims !== 'object') return null;
    if (claims.purpose !== purpose || typeof claims.exp !== 'number' || claims.exp <= Date.now()) return null;
    return claims as Record<string, unknown>;
  } catch {
    return null;
  }
}
