import crypto from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';

// Attempt counters for sign-ins, one-time codes and the public forms, kept in
// the database so they hold across restarts. A key is counted inside a fixed
// window; once the window has passed the count starts again.

const MINUTE = 60 * 1000;
export const WINDOW = { tenMinutes: 10 * MINUTE, fifteenMinutes: 15 * MINUTE, hour: 60 * MINUTE } as const;

// Only the hash is stored: keys are built from emails, phones and addresses
function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// The visitor's address as Nginx reports it (see scripts/vps/setup.sh). The
// X-Forwarded-For fallback takes the last entry, the one the proxy appended,
// since everything before it comes from the visitor and can be made up.
export async function clientIp(): Promise<string> {
  const list = await headers();
  const real = list.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = list.get('x-forwarded-for')?.split(',').pop()?.trim();
  return forwarded || 'unknown';
}

// Counts one attempt for `key`. False once more than `max` were made inside
// the window. A single statement, so parallel requests can't slip past.
export async function takeAttempt(key: string, max: number, windowMs: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "auth_attempts" ("key", "count", "windowStart")
    VALUES (${hashKey(key)}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "auth_attempts"."windowStart" < now() - (${windowMs} * interval '1 millisecond') THEN 1
        ELSE "auth_attempts"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "auth_attempts"."windowStart" < now() - (${windowMs} * interval '1 millisecond') THEN now()
        ELSE "auth_attempts"."windowStart"
      END
    RETURNING "count"`;
  return Number(rows[0]?.count ?? max + 1) <= max;
}

// Every key must still have attempts left. All of them are counted, so a
// blocked address keeps counting against the account it is hammering.
export async function takeAttempts(checks: Array<[key: string, max: number, windowMs: number]>): Promise<boolean> {
  const results = await Promise.all(checks.map(([key, max, windowMs]) => takeAttempt(key, max, windowMs)));
  return results.every(Boolean);
}

// After a successful sign-in, so earlier typos don't count against the next one
export async function clearAttempts(key: string): Promise<void> {
  await prisma.authAttempt.deleteMany({ where: { key: hashKey(key) } });
}

// Old counters are only housekeeping; called from the daily cron
export async function purgeOldAttempts(): Promise<number> {
  const { count } = await prisma.authAttempt.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 24 * WINDOW.hour) } } });
  return count;
}
