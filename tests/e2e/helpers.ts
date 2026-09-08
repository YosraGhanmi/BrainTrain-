import { Page, expect } from '@playwright/test';

// A 1px tolerance absorbs scrollbar/subpixel rounding without masking a real
// overflow bug (which is typically tens or hundreds of pixels wide).
export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth - clientWidth, `${label}: horizontal overflow (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`).toBeLessThanOrEqual(1);
}

export async function checkRoute(page: Page, path: string, label?: string) {
  const response = await page.goto(path, { waitUntil: 'load' });
  expect(response?.ok(), `${label ?? path}: expected a successful HTTP response`).toBeTruthy();
  await page.waitForTimeout(150);
  await expectNoHorizontalOverflow(page, label ?? path);
}

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 10000)}@braintrain-e2e.test`;
}
