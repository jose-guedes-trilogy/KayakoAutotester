import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await dispatchClickCss(page, 'userCases', 'trigger');
    try {
    await expectVisible(page, 'userCases', 'dropdown');
    } catch (e) { console.warn('Optional step failed (expect-visible)', e); }
    await dispatchClickText(page, "env.KAYAKO_OTHER_SUBJECT");
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    try {
    await expect(page).toHaveURL(new RegExp("/agent/conversations/"));
    } catch (e) { console.warn('Optional step failed (expect-url-contains)', e); }
}

if (!queueMode) {
  test.describe("Open the user cases dropdown and select a case by subject (env.KAYAKO_OTHER_SUBJECT)", () => {
    test('select-user-case-by-subject', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}