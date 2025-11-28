import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Agent opens first conversation and adds an internal note", () => {
  test('add-internal-note', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    await expectVisible(page, 'conversation', 'subjectHeading');
    await page.waitForTimeout(1500);
    await expectVisible(page, 'composer', 'editor');
    await click(page, 'composer', 'editor');
    await page.waitForTimeout(400);
    await dispatchClickText(page, "Notes");
    await page.waitForTimeout(400);
    await expectVisible(page, 'composer', 'notePlaceholder');
    await fillSel(page, 'composer', 'editor', "[AUTOTEST] Internal note added by MCP");
    await click(page, 'composer', 'sendButton');
    await expectVisible(page, 'conversation', 'noteText');
    await page.waitForTimeout(5000);
  });
});