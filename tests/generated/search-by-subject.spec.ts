import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';

test.describe("Agent searches for a conversation by subject and opens it", () => {
  test('search-by-subject', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await expectVisible(page, 'search', 'input');
    await fillSel(page, 'search', 'input', "[TEST PREFIX]");
    await page.keyboard.press("Enter");
    await expectVisible(page, 'search', 'resultItem');
    await click(page, 'search', 'resultItem');
    await expectVisible(page, 'conversation', 'subjectHeading');
  });
});