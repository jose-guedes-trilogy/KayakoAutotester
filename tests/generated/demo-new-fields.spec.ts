import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Fill all newly supported field types (radio, text, textarea, regex, integer, decimal, checkboxes)", () => {
  test('demo-new-fields', async ({ authenticatedPage: page }) => {
    try {
    if (env.KAYAKO_CONVERSATION_ID) { await page.goto(env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/' + env.KAYAKO_CONVERSATION_ID); }
    } catch (e) { console.warn('Optional step failed (goto-conversation-by-env-id)', e); }
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    await setCustomField(page, {"type":"radio","label":"Radio"} as any);
    await setCustomField(page, {"type":"text","label":"Text","value":"Sample single-line text"} as any);
    await setCustomField(page, {"type":"textarea","label":"Multiline text","value":"Line 1\nLine 2\nLine 3"} as any);
    await setCustomField(page, {"type":"regex","label":"Regex","value":"ABC-123"} as any);
    await setCustomField(page, {"type":"integer","label":"Integers","value":42} as any);
    await setCustomField(page, {"type":"decimal","label":"Decimals","value":123.45} as any);
    await setCustomField(page, {"type":"checkbox","label":"Checkboxes","value":["Option-A-Title","Option-B-Title"]} as any);
    await page.waitForTimeout(2000);
  });
});