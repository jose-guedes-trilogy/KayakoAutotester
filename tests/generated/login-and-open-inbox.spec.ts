import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';

test.describe("Agent logs in and opens conversations inbox", () => {
  test('login-and-open-inbox', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await expectVisible(page, 'nav', 'conversationsLink');
    await click(page, 'nav', 'conversationsLink');
    await expect(page).toHaveURL(new RegExp("conversations"));
  });
});