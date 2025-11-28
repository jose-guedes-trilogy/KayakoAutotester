import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';

test.describe("Agent opens first conversation and assigns it to self", () => {
  test('assign-to-me', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await expectVisible(page, 'composer', 'editor');
    await click(page, 'composer', 'editor');
    await page.waitForTimeout(250);
    try {
    await dispatchClickCss(page, 'assign', 'assignToMeTrigger');
    } catch (e) { console.warn('Optional step failed (dispatch-click)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "General");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await click(page, 'assign', 'selfOption');
    } catch (e) { console.warn('Optional step failed (click)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    await click(page, 'assign', 'assigneeFieldTrigger');
    await page.waitForTimeout(250);
    await dispatchClickText(page, "General");
    await page.waitForTimeout(250);
    await click(page, 'assign', 'selfOption');
    await page.waitForTimeout(200);
    try {
    await click(page, 'assign', 'updatePropertiesButton');
    } catch (e) { console.warn('Optional step failed (click)', e); }
    await expectVisible(page, 'assign', 'confirmation');
  });
});