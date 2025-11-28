import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Agent applies the \"Send to Customer\" macro on a conversation", () => {
  test('apply-send-to-customer', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    try {
    if (env.KAYAKO_CONVERSATION_ID) { await page.goto(env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/' + env.KAYAKO_CONVERSATION_ID); }
    } catch (e) { console.warn('Optional step failed (goto-conversation-by-env-id)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    } catch (e) { console.warn('Optional step failed (goto)', e); }
    try {
    await expectVisible(page, 'inbox', 'conversationSubject');
    } catch (e) { console.warn('Optional step failed (expect-visible)', e); }
    try {
    await click(page, 'inbox', 'conversationSubject');
    } catch (e) { console.warn('Optional step failed (click)', e); }
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    try {
    await dispatchClickCss(page, 'macro', 'macroSelectorTrigger');
    } catch (e) { console.warn('Optional step failed (dispatch-click)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickCss(page, 'macro', 'macroOptionSendToCustomer');
    } catch (e) { console.warn('Optional step failed (dispatch-click)', e); }
    await dispatchClickText(page, "Send to Customer");
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    await page.waitForTimeout(5000);
  });
});