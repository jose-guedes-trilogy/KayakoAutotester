import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Agent searches for a conversation by subject and opens it", () => {
  test('search-by-subject', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await expectVisible(page, 'search', 'input');
    await fillSel(page, 'search', 'input', "[TEST PREFIX]");
    await page.keyboard.press("Enter");
    await expectVisible(page, 'search', 'resultItem');
    await click(page, 'search', 'resultItem');
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    await expectVisible(page, 'conversation', 'subjectHeading');
    await page.waitForTimeout(5000);
  });
});