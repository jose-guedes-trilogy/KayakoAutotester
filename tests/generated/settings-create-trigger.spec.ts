import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto(env.KAYAKO_BASE_URL + "/admin/automation/triggers/new");
    await expectVisible(page, 'settings', 'triggerTitleInput');
    await fillSel(page, 'settings', 'triggerTitleInput', "[AUTOTEST] MCP Trigger");
    await setTriggerConditionStatus(page, "New");
    await setTriggerActionStatus(page, "Pending");
    await click(page, 'settings', 'saveTriggerButton');
    await expect(page).toHaveURL(new RegExp("/admin/automation/triggers"));
}

if (!queueMode) {
  test.describe("Create a simple trigger that fires when status is New and changes status (UI-only smoke)", () => {
    test('settings-create-trigger', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}