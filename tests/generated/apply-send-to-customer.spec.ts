import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await dispatchClickCss(page, 'macro', 'macroSelectorTrigger');
    await page.waitForTimeout(250);
    try {
    await expectVisible(page, 'macro', 'macroDropdownContainer');
    } catch (e) { console.warn('Optional step failed (expect-visible)', e); }
    try {
    await dispatchClickCss(page, 'macro', 'macroOptionSendToCustomer');
    } catch (e) { console.warn('Optional step failed (dispatch-click)', e); }
    await dispatchClickText(page, "Send to Customer");
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
    await page.waitForTimeout(1500);
}

if (!queueMode) {
  test.describe("Agent applies the \"Send to Customer\" macro on a conversation", () => {
    test('apply-send-to-customer', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}