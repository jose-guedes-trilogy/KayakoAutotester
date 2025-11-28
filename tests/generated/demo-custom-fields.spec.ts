import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Demonstrate setting yes/no, cascading select (multi-level), and date fields", () => {
  test('demo-custom-fields', async ({ authenticatedPage: page }) => {
    if (env.KAYAKO_CONVERSATION_ID) { await page.goto(env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/' + env.KAYAKO_CONVERSATION_ID); }
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await setCustomField(page, {"type":"yesno","label":"Yes/no toggle","value":true} as any);
    await setCustomField(page, {"type":"cascading","label":"Cascading select","path":["Category-A","Subcategory-A","Item-1"]} as any);
    await setCustomField(page, {"type":"date","label":"Date of purchase","value":"2025-04-05"} as any);
    await page.waitForTimeout(3000);
  });
});