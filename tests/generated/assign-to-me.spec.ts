import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField } from '../../selectors';

test.describe("Agent opens first conversation and assigns it to self", () => {
  test('assign-to-me', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    try {
    if (env.KAYAKO_CONVERSATION_ID) { await page.goto(env.KAYAKO_AGENT_URL.replace(/\/$/, '') + '/conversations/' + env.KAYAKO_CONVERSATION_ID); }
    } catch (e) { console.warn('Optional step failed (goto-conversation-by-env-id)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    await (await import('../../selectors')).switchAssigneeTeamAndSave(page, ["VIP Account Team", "General"]);
    try {
    await (await import('../../selectors')).logAssigneeValues(page);
    } catch (e) { console.warn('Optional step failed (log-assignee)', e); }
    await page.waitForTimeout(5000);
  });
});