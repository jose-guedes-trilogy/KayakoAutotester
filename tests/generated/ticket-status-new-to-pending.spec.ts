import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await createNewTicket(page, env.KAYAKO_USERNAME, "[AUTOTEST] Ticket New→Pending", "[AUTOTEST] Ticket New to Pending body", 'reply');
    await setStatus(page, "Pending");
    await click(page, 'assign', 'updatePropertiesButton');
    await expectStatusLabel(page, "Pending");
}

if (!queueMode) {
  test.describe("Create a new ticket and change its status from New to Pending via the Status field", () => {
    test('ticket-status-new-to-pending', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}