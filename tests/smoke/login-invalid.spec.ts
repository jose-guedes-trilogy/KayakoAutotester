import { test, expect } from '@playwright/test';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible } from '../../selectors';

test.describe('Login error handling', () => {
  test('Invalid credentials show error', async ({ page }) => {
    await page.goto(`${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/login`);
    await fillSel(page, 'login', 'emailInput', env.KAYAKO_USERNAME);
    await fillSel(page, 'login', 'passwordInput', 'definitely-wrong-password');
    await click(page, 'login', 'submitButton');
    await expectVisible(page, 'login', 'errorInvalidCombo');
  });
});


