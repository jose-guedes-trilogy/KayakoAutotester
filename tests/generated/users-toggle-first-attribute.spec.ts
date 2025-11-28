import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    { const current = page.url(); if (!current.includes('/agent/users')) { await page.goto(env.KAYAKO_AGENT_URL + "/users"); } }
    await expectVisible(page, 'users', 'sidebar');
    await click(page, 'users', 'definitionCheckbox');
    await expectVisible(page, 'users', 'definitionTextInput');
    await fillSel(page, 'users', 'definitionTextInput', "José Guedes");
    await page.waitForTimeout(1500);
}

if (!queueMode) {
  test.describe("Toggle the Name attribute and type a filter value", () => {
    test('users-toggle-first-attribute', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}