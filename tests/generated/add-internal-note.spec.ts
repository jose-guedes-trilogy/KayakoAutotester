import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await dispatchClickCss(page, 'composer', 'internalNoteToggle');
    await page.waitForTimeout(150);
    await insertReplyText(page, "env.KAYAKO_NOTE_TEXT");
    await page.waitForTimeout(200);
}

if (!queueMode) {
  test.describe("Switch to Notes mode and insert an internal note (env.KAYAKO_NOTE_TEXT)", () => {
    test('add-internal-note', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}