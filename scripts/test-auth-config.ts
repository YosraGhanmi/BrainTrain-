import assert from 'node:assert/strict';

async function main(): Promise<void> {
  const original = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };

  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;

  const adminSession = await import('../lib/auth/session');
  const portalSession = await import('../lib/portal-auth/session');

  assert.equal(adminSession.checkCredentials('admin@braintrain.tn', 'braintrain-admin'), false);
  assert.equal(adminSession.verifySessionToken('not-a-real-token'), false);
  assert.throws(() => adminSession.createSessionToken(), /ADMIN_SESSION_SECRET is not configured/);
  assert.throws(() => portalSession.createPendingTeacherToken('teacher-uid'), /ADMIN_SESSION_SECRET is not configured/);
  assert.equal(portalSession.verifyPendingTeacherToken('not-a-real-token'), null);

  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  console.log('auth config fail-closed checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
