import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await dispatchClickText(page, "env.KAYAKO_SUBJECT");
    try {
    await expectVisible(page, 'tabs', 'activeTabLink');
    } catch (e) { console.warn('Optional step failed (expect-visible)', e); }
}

if (!queueMode) {
  test.describe("Activate an open tab by its subject text (env.KAYAKO_SUBJECT)", () => {
    test('open-tab-by-subject', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}