import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { firstAvailableLocator, fill as fillSel } from '../../selectors';

test.describe('Login form gating', () => {
  test('Login button enables only after both fields filled', async ({ page }) => {
    await page.goto(`${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/login`);

    const submit = await firstAvailableLocator(page, 'login', 'submitButton');
    await expect(submit.locator).toBeDisabled();

    await fillSel(page, 'login', 'emailInput', env.KAYAKO_USERNAME);
    await expect(submit.locator).toBeDisabled();

    await fillSel(page, 'login', 'passwordInput', env.KAYAKO_PASSWORD);
    await expect(submit.locator).toBeEnabled();
  });
});


