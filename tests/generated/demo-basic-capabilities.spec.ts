import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Demonstrate basic reusable actions (reply text, tags, status)", () => {
  test('demo-basic-capabilities', async ({ authenticatedPage: page }) => {
    if (env.KAYAKO_CONVERSATION_ID) { await page.goto(env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/' + env.KAYAKO_CONVERSATION_ID); }
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await expectVisible(page, 'composer', 'editor');
    await switchToReplyMode(page);
    await insertReplyText(page, "[AUTOTEST] Demo reply text");
    await addTags(page, ["demo","automation"]);
    await setStatus(page, "Pending");
    await page.waitForTimeout(5000);
  });
});