import { test, expect } from '@playwright/test';
import { checkRoute, expectNoHorizontalOverflow } from './helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@braintrain.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'braintrain-admin';

const ADMIN_ROUTES = [
  '/admin',
  '/admin/messages',
  '/admin/sponsors',
  '/admin/stats',
  '/admin/courses',
  '/admin/age-groups',
  '/admin/contact',
  '/admin/socials',
  '/admin/achievements',
  '/admin/timeline',
  '/admin/parents',
  '/admin/children',
  '/admin/teachers',
  '/admin/secretaries',
  '/admin/sessions',
  '/admin/enrollments',
  '/admin/payments',
  '/admin/pricing',
  '/admin/news',
  '/admin/calendar',
];

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/login?role=admin');
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('**/admin', { timeout: 15_000 });
}

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const route of ADMIN_ROUTES) {
    test(`admin route loads without overflow: ${route}`, async ({ page }) => {
      await checkRoute(page, route, `admin ${route}`);
    });
  }

  test('mobile sidebar drawer opens, shows nav, and closes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop-1440', 'sidebar is static at desktop width');
    await page.goto('/admin');

    const openButton = page.getByRole('button', { name: /open menu/i });
    await expect(openButton).toBeVisible();
    await openButton.click();

    const dashboardLink = page.getByRole('link', { name: /dashboard/i }).first();
    await expect(dashboardLink).toBeVisible();
    await expectNoHorizontalOverflow(page, 'admin mobile drawer open');

    const closeButton = page.getByRole('button', { name: /close menu/i });
    await closeButton.click();
    await expect(dashboardLink).toBeHidden();
  });

  test('navigating via sidebar keeps the page overflow-free', async ({ page }, testInfo) => {
    await page.goto('/admin');
    if (testInfo.project.name !== 'desktop-1440') {
      await page.getByRole('button', { name: /open menu/i }).click();
    }
    await page.getByRole('link', { name: /^messages$/i }).click();
    await page.waitForURL('**/admin/messages');
    await expectNoHorizontalOverflow(page, 'admin messages after sidebar nav');
  });
});
