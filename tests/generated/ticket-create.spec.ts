import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await createNewTicket(page, env.KAYAKO_USERNAME, "[AUTOTEST] New ticket for completion/deletion flows", "[AUTOTEST] Initial message body", 'reply');
}

if (!queueMode) {
  test.describe("Create a brand new ticket via New → Conversation and send a first public reply", () => {
    test('ticket-create', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}