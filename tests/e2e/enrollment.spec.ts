import { test, expect, type Page } from '@playwright/test';
import { uniqueEmail } from './helpers';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@braintrain.tn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'braintrain-admin';

// The money path end to end: admin sets prices and a group, a parent enrolls
// a child and pays at the desk, the admin marks it paid, resets the parent's
// password, and the summer school bills its monthly plan once per month.
// Writes real rows, so run it against a test database.

async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login?role=admin');
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('**/admin', { timeout: 15_000 });
}

function signInForm(page: Page) {
  return page.locator('form', { has: page.locator('#parent-login-email') });
}

async function loginAsParent(page: Page, email: string, password: string) {
  await page.goto('/en/parent-portal/login');
  await signInForm(page).locator('#parent-login-email').fill(email);
  await signInForm(page).locator('input[name="password"]').fill(password);
  await signInForm(page).getByRole('button', { name: /log in/i }).click();
  await page.waitForURL(/\/parent-portal(?!\/login)/, { timeout: 15_000 });
}

// Walks the three-step enroll wizard on a course page
async function enroll(page: Page, coursePath: string, group: RegExp) {
  await page.goto(coursePath);
  await page.getByRole('button', { name: group }).first().click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /monthly/i }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Cash', exact: true }).click();
  await page.getByRole('button', { name: 'Enroll', exact: true }).click();
  await page.waitForURL(/\/children\/[^/]+\/courses\/[^/?]+\?saved=1/, { timeout: 20_000 });
}

test.describe('Enrollment and payments', () => {
  test('prices, group, enroll, pay, reset password, summer school', async ({ page, browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'one run is enough');
    test.setTimeout(300_000);

    const run = String(Date.now() % 1_000_000);
    const slotLabel = `E2E${run}`;
    // Groups are named after the slot matching their day and time, so each
    // run gets its own time
    const minute = String(Number(run) % 60).padStart(2, '0');
    const email = uniqueEmail('enroll');
    const childName = `E2E Child ${run}`;
    const password = 'TestPass1234!';

    const admin = await (await browser.newContext()).newPage();
    await loginAsAdmin(admin);

    // --- Admin: a weekly slot, age-group prices, a Robotics group ---------
    await admin.goto('/admin/time-slots');
    const newSlot = admin.locator('details', { hasText: '+ New time slot' });
    await newSlot.locator('summary').click();
    await newSlot.locator('input[name="label"]').fill(slotLabel);
    await newSlot.locator('select[name="dayOfWeek"]').selectOption('4');
    await newSlot.locator('input[name="startTime"]').fill(`17:${minute}`);
    await newSlot.locator('input[name="endTime"]').fill(`18:${minute}`);
    await newSlot.getByRole('button', { name: 'Add time slot' }).click();
    await expect(admin.getByText('Saved.')).toBeVisible();

    await admin.goto('/admin/pricing');
    const prices = admin.locator('form', { has: admin.getByRole('heading', { name: '10-13 years' }) });
    await prices.locator('input[name="amount_MONTHLY"]').fill('150');
    await prices.locator('input[name="amount_QUARTERLY"]').fill('400');
    await prices.locator('input[name="amount_YEARLY"]').fill('1200');
    await prices.getByRole('button', { name: 'Save' }).click();
    await expect(admin.getByText('Saved.')).toBeVisible();

    await admin.goto('/admin/sessions');
    await admin.getByRole('button', { name: /add session/i }).click();
    await admin.getByRole('button', { name: 'Course', exact: true }).click();
    await admin.getByRole('button', { name: /10-13 years/ }).click();
    await admin.getByRole('option', { name: 'Robotics' }).click();
    await admin.locator('select[name="timeSlotId"]').selectOption({ label: `${slotLabel} · Thursday 17:${minute}–18:${minute}` });
    await admin.locator('input[name="location"]').fill('Room E2E');
    await admin.getByRole('button', { name: 'Add session' }).click();
    await expect(admin.getByText('Saved.')).toBeVisible();

    // --- Parent signs up and is approved -----------------------------------
    await page.goto('/en/parent-portal/register');
    const register = page.locator('form', { has: page.locator('input[name="confirmPassword"]') });
    await register.locator('input[name="fullName"]').fill(`E2E Parent ${run}`);
    await register.locator('input[name="email"]').fill(email);
    await register.locator('input[name="phone"]').fill(`2${run.padStart(7, '0')}`);
    await register.locator('input[name="password"]').fill(password);
    await register.locator('input[name="confirmPassword"]').fill(password);
    await register.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL(/parent-portal\/pending/, { timeout: 15_000 });

    await admin.goto('/admin/parents');
    await admin.locator('tr', { hasText: email }).getByRole('button', { name: /accept/i }).click();
    await expect(admin.locator('tr', { hasText: email }).getByText(/approved/i)).toBeVisible();

    // --- Parent adds a child (born 2015: the 10-13 group) and enrolls ------
    await loginAsParent(page, email, password);
    await page.goto('/en/parent-portal/children/new');
    await page.locator('input[name="fullName"]').fill(childName);
    await page.locator('input[name="dateOfBirth"]').fill('2015-05-20');
    await page.getByRole('button', { name: /add child/i }).click();
    await page.waitForURL(/\/parent-portal/, { timeout: 15_000 });

    await enroll(page, '/en/parent-portal/courses/robotique-10-13', new RegExp(slotLabel));
    await expect(page.getByText(/150/).first()).toBeVisible();

    // --- Admin marks the desk payment paid ---------------------------------
    await admin.goto('/admin/payments');
    const paymentRow = admin.locator('tr', { hasText: childName });
    await expect(paymentRow).toHaveCount(1);
    await paymentRow.getByRole('button', { name: 'Mark paid' }).click();
    await expect(admin.locator('tr', { hasText: childName }).getByText('PAID')).toBeVisible();

    // --- Admin sets a new password; old sessions stop working --------------
    const newPassword = 'Changed12345';
    await admin.goto('/admin/parents');
    await admin.locator('tr', { hasText: email }).getByRole('button', { name: 'Set new password' }).click();
    await admin.locator('input[name="password"]').fill(newPassword);
    await admin.getByRole('button', { name: 'Save password' }).click();
    await admin.waitForURL(/saved=password/);

    await page.goto('/en/parent-portal');
    await expect(page).toHaveURL(/parent-portal\/login/);
    await loginAsParent(page, email, newPassword);

    // --- Summer school: load the sheet, open it, enroll monthly ------------
    await admin.goto('/admin/summer-school');
    const load = admin.getByRole('button', { name: 'Load the summer programme' });
    if (await load.isVisible()) {
      await load.click();
      await expect(admin.getByText('Saved.')).toBeVisible();
    }
    const open = admin.getByRole('button', { name: 'Open summer school' });
    if (await open.isVisible()) {
      await open.click();
      await expect(admin.getByText('Open: visible to parents')).toBeVisible();
    }

    await enroll(page, '/en/parent-portal/courses/summer-twice-a-week-10-13', /GRP1/);

    // Monthly summer plan: this month plus one payment per later month of the season
    await admin.goto('/admin/payments');
    await expect(admin.locator('tr', { hasText: childName })).toHaveCount(1 + 3);

    await admin.context().close();
  });
});
