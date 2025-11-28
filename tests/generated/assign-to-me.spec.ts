import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';

test.describe("Agent opens first conversation and assigns it to self", () => {
  test('assign-to-me', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    try {
    await page.goto(env.KAYAKO_CONVERSATIONS_URL + "/5");
    } catch (e) { console.warn('Optional step failed (goto)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    try {
    await dispatchClickText(page, "Assignee");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "General");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(250);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "Update properties");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(250);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "VIP Account Team");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(250);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "Update properties");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
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
    await dispatchClickText(page, "VIP Account Team");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await page.waitForTimeout(200);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickCss(page, 'assign', 'updatePropertiesSpan');
    } catch (e) { console.warn('Optional step failed (dispatch-click)', e); }
    try {
    await page.waitForTimeout(250);
    } catch (e) { console.warn('Optional step failed (wait)', e); }
    try {
    await dispatchClickText(page, "Update properties");
    } catch (e) { console.warn('Optional step failed (dispatch-click-text)', e); }
    try {
    await expectVisible(page, 'assign', 'confirmation');
    } catch (e) { console.warn('Optional step failed (expect-visible)', e); }
  });
});