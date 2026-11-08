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

test.describe('FAQ', () => {
  test('one answer shows at a time, and the enroll answer links to the form', async ({ page }) => {
    await page.goto('/en');
    const faq = page.locator('#faq');
    const first = faq.getByRole('button', { name: 'What is BrainTrain Academy?' });
    const enroll = faq.getByRole('button', { name: 'How do I enroll my child?' });
    const button = faq.getByRole('link', { name: 'Pre-register' });

    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toBeHidden();

    await enroll.click();
    await expect(enroll).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('href', /\/preinscription$/);
    await expectNoHorizontalOverflow(page, 'FAQ with the enroll answer open');
  });
});

test.describe('Courses navigation', () => {
  test('age group cards show a label, summary and both actions', async ({ page }) => {
    await page.goto('/en/courses/4-5');
    const card = page.locator('article').filter({ hasText: 'Tech Explorers' });
    await expect(card.getByText('Technology')).toBeVisible();
    await expect(card.getByText('Explore, create and understand the digital world.')).toBeVisible();
    await expect(card.getByText('4-5 years')).toBeVisible();
    await expect(card.getByRole('link', { name: /Discover the program/ })).toHaveAttribute('href', /tech-explorers-4-5/);
    await expect(card.getByRole('link', { name: /^Enroll/ })).toBeVisible();
    await expectNoHorizontalOverflow(page, 'age group course cards');
  });

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
