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
  delete process.env.PORTAL_SESSION_SECRET;

  const adminSession = await import('../lib/auth/session');
  const portalSession = await import('../lib/portal-auth/session');

  assert.equal(adminSession.checkCredentials('admin@braintrain.tn', 'braintrain-admin'), false);
  assert.equal(adminSession.verifySessionToken('not-a-real-token'), false);
  assert.throws(() => adminSession.createSessionToken(), /ADMIN_SESSION_SECRET is not configured/);
  assert.throws(() => portalSession.createPendingTeacherToken('teacher-uid'), /ADMIN_SESSION_SECRET is not configured/);
  assert.equal(portalSession.verifyPendingTeacherToken('not-a-real-token'), null);

  // A token made for one purpose is never accepted for another, with one
  // shared secret or with two
  for (const portalSecret of [undefined, 'portal-secret-for-this-test']) {
    process.env.ADMIN_SESSION_SECRET = 'admin-secret-for-this-test';
    if (portalSecret) process.env.PORTAL_SESSION_SECRET = portalSecret;
    else delete process.env.PORTAL_SESSION_SECRET;

    const adminToken = adminSession.createSessionToken();
    const teacherToken = portalSession.createPendingTeacherToken('teacher-uid');
    const parentToken = portalSession.createPendingParentToken('parent-uid');

    assert.equal(adminSession.verifySessionToken(adminToken), true);
    assert.equal(portalSession.verifyPendingTeacherToken(teacherToken), 'teacher-uid');
    assert.equal(portalSession.verifyPendingParentToken(parentToken), 'parent-uid');

    assert.equal(adminSession.verifySessionToken(teacherToken), false);
    assert.equal(adminSession.verifySessionToken(parentToken), false);
    assert.equal(portalSession.verifyPendingTeacherToken(adminToken), null);
    assert.equal(portalSession.verifyPendingTeacherToken(parentToken), null);
    assert.equal(portalSession.verifyPendingParentToken(adminToken), null);
    assert.equal(portalSession.verifyPendingParentToken(teacherToken), null);

    // Tampered payload, same signature
    const [, signature] = adminToken.split('.');
    const forged = `${Buffer.from(JSON.stringify({ purpose: 'admin-session', exp: Date.now() + 1e9 })).toString('base64url')}.${signature}`;
    assert.equal(adminSession.verifySessionToken(forged), false);
  }
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.PORTAL_SESSION_SECRET;

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
