import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await createNewTicket(page, env.KAYAKO_USERNAME, "[AUTOTEST] Ticket to reopen", "[AUTOTEST] Ticket reopen body", 'reply');
    await completeConversation(page);
    await reopenConversation(page, "Open");
}

if (!queueMode) {
  test.describe("Complete a ticket and then reopen it to Open status via the Status field", () => {
    test('ticket-reopen', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}