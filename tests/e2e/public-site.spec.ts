import { test, expect } from '@playwright/test';
import { checkRoute, expectNoHorizontalOverflow } from './helpers';

const PUBLIC_ROUTES = [
  '/en',
  '/en/courses',
  '/en/parent-portal/login',
  '/en/parent-portal/register',
  '/en/parent-portal/forgot-password',
  '/en/teacher/login',
  '/admin/login',
];

test.describe('Public site — loads and has no horizontal overflow', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`route loads cleanly: ${route}`, async ({ page }) => {
      await checkRoute(page, route);
    });
  }
});

test.describe('Navbar', () => {
  test('desktop nav links are visible, mobile nav opens via hamburger', async ({ page }, testInfo) => {
    await page.goto('/en');
    const isMobile = testInfo.project.name === 'mobile-390' || testInfo.project.name === 'tablet-820';

    if (isMobile) {
      const toggle = page.getByRole('button', { name: /open menu/i });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(page.getByRole('link', { name: /courses/i }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page, 'navbar mobile menu open');
    } else {
      await expect(page.getByRole('link', { name: /courses/i }).first()).toBeVisible();
    }
  });

  test('footer is present', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('footer')).toBeVisible();
  });
});

test.describe('Courses navigation', () => {
  test('can open a course detail page from the courses list', async ({ page }) => {
    await page.goto('/en/courses');
    const firstCourseLink = page.locator('a[href*="/courses/"], a[href*="/course/"]').first();
    if (await firstCourseLink.count()) {
      await firstCourseLink.click();
      await page.waitForLoadState('load');
      await expectNoHorizontalOverflow(page, 'course detail page');
    }
  });
});
