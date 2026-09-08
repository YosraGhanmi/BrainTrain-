import { test, expect } from '@playwright/test';
import { checkRoute, expectNoHorizontalOverflow, uniqueEmail } from './helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@braintrain.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'braintrain-admin';
const DEFAULT_TEACHER_PASSWORD = 'braintrain@TEACHER';

test.describe('Teacher portal — admin creates account, teacher logs in and navigates', () => {
  test('create teacher via admin, log in as teacher, verify code, browse the portal', async ({ page, browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'runs once on the mobile project to also exercise the drawer');

    const email = uniqueEmail('teacher');
    const fullName = 'E2E Test Teacher';
    const phone = `2${Math.floor(10000000 + Math.random() * 89999999)}`;

    // --- Admin creates the teacher account ---------------------------------
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin/login?role=admin');
    await adminPage.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await adminPage.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await adminPage.getByRole('button', { name: /log in/i }).click();
    await adminPage.waitForURL('**/admin', { timeout: 15_000 });

    await adminPage.goto('/admin/teachers');
    await adminPage.getByRole('button', { name: /add teacher/i }).click();
    await adminPage.locator('input[name="fullName"]').fill(fullName);
    await adminPage.locator('input[name="email"]').fill(email);
    await adminPage.locator('input[name="phone"]').fill(phone);
    await adminPage.locator('select[name="courseSlug"]').selectOption({ index: 1 });
    await adminPage.getByRole('button', { name: /create teacher account/i }).click();
    await adminPage.waitForURL(/\/admin\/teachers\?/, { timeout: 15_000 });

    const url = new URL(adminPage.url());
    const secretCode = url.searchParams.get('code');
    expect(secretCode, 'admin should redirect back with the generated secret code in the URL').toBeTruthy();
    await adminContext.close();

    // --- Teacher logs in -----------------------------------------------------
    await page.goto('/en/teacher/login');
    await page.locator('#teacher-login-email').fill(email);
    await page.locator('input[name="password"]').fill(DEFAULT_TEACHER_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/teacher\/verify/, { timeout: 15_000 });
    await expectNoHorizontalOverflow(page, 'teacher verify page');

    await page.locator('input[name="code"]').fill(secretCode!);
    await page.getByRole('button', { name: /confirm/i }).click();
    await page.waitForURL(/\/teacher(?!\/(login|verify))/, { timeout: 15_000 });
    await expectNoHorizontalOverflow(page, 'teacher dashboard after login');

    // --- Mobile drawer sanity check ------------------------------------------
    const openButton = page.getByRole('button', { name: /open menu/i });
    if (await openButton.isVisible()) {
      await openButton.click();
      await expect(page.getByRole('link', { name: /my groups/i })).toBeVisible();
      await expectNoHorizontalOverflow(page, 'teacher portal mobile drawer open');
      await page.getByRole('button', { name: /close menu/i }).click();
    }

    // --- Walk teacher pages -----------------------------------------------
    await checkRoute(page, '/en/teacher', 'teacher dashboard');
    await checkRoute(page, '/en/teacher/calendar', 'teacher calendar');
  });
});
