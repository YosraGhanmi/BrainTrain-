import { test, expect } from '@playwright/test';
import { checkRoute, expectNoHorizontalOverflow, uniqueEmail } from './helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@braintrain.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'braintrain-admin';

// Only run this full authenticated flow once (on desktop) — every viewport
// re-running it against a fresh test account would be slow and redundant;
// per-viewport overflow checks are what tests/e2e/admin.spec.ts and
// public-site.spec.ts already do for routes reachable without a live child.
test.describe('Parent portal — registration, approval, and navigation', () => {
  test('register, get approved by admin, log in, add a child, and browse the portal', async ({ page, browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'runs once on the mobile project to also exercise the drawer');

    const email = uniqueEmail('parent');
    const fullName = 'E2E Test Parent';
    const phone = `2${Math.floor(10000000 + Math.random() * 89999999)}`;
    const password = 'TestPass1234!';

    // --- Register ---------------------------------------------------------
    await page.goto('/en/parent-portal/register');
    await page.locator('input[name="fullName"]').fill(fullName);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="phone"]').fill(phone);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/parent-portal\/login/, { timeout: 15_000 });

    // Unapproved login should be rejected as pending.
    await page.locator('#parent-login-email').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByText(/awaiting admin approval/i)).toBeVisible({ timeout: 10_000 });

    // --- Admin approves the account in a separate browser context --------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin/login?role=admin');
    await adminPage.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await adminPage.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await adminPage.getByRole('button', { name: /log in/i }).click();
    await adminPage.waitForURL('**/admin', { timeout: 15_000 });

    await adminPage.goto('/admin/parents');
    const parentRow = adminPage.locator('tr', { hasText: email });
    await expect(parentRow).toBeVisible({ timeout: 10_000 });
    await parentRow.getByRole('button', { name: /accept/i }).click();
    await expect(adminPage.locator('tr', { hasText: email }).getByText(/approved/i)).toBeVisible({ timeout: 10_000 });
    await adminContext.close();

    // --- Parent logs in now that they're approved -------------------------
    await page.goto('/en/parent-portal/login');
    await page.locator('#parent-login-email').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/parent-portal(?!\/login)/, { timeout: 15_000 });
    await expectNoHorizontalOverflow(page, 'parent dashboard after login');

    // --- Mobile drawer sanity check ---------------------------------------
    const openButton = page.getByRole('button', { name: /open menu/i });
    if (await openButton.isVisible()) {
      await openButton.click();
      await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page, 'parent portal mobile drawer open');
      await page.getByRole('button', { name: /close menu/i }).click();
    }

    // --- Add a child --------------------------------------------------------
    await page.goto('/en/parent-portal/children/new');
    await page.locator('input[name="fullName"]').fill('E2E Test Child');
    await page.locator('input[name="dateOfBirth"]').fill('2015-05-20');
    const ageGroupSelect = page.locator('select[name="ageGroupSlug"]');
    const optionValues = await ageGroupSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value).filter(Boolean)
    );
    if (optionValues.length > 0) {
      await ageGroupSelect.selectOption(optionValues[0]);
    }
    await page.getByRole('button', { name: /add child/i }).click();
    await page.waitForURL(/\/parent-portal/, { timeout: 15_000 });

    // --- Walk every top-level portal page ----------------------------------
    const routes = [
      '/en/parent-portal',
      '/en/parent-portal/courses',
      '/en/parent-portal/schedule',
      '/en/parent-portal/payments',
      '/en/parent-portal/account',
    ];
    for (const route of routes) {
      await checkRoute(page, route, `parent portal ${route}`);
    }
  });
});
