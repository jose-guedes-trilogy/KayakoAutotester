import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await switchToReplyMode(page);
    await click(page, 'composer', 'toolbarBulletedList');
    await insertReplyText(page, "Bullet 1 normal");
    await page.keyboard.press("Enter");
    await insertReplyText(page, "Bullet 2 ");
    await click(page, 'composer', 'toolbarBoldButton');
    await insertReplyText(page, "BOLD");
    await click(page, 'composer', 'toolbarBoldButton');
    await insertReplyText(page, " not bold");
    await page.keyboard.press("Enter");
    await click(page, 'composer', 'toolbarItalicButton');
    await insertReplyText(page, "Bullet 3 ");
    await insertReplyText(page, "italics");
    await click(page, 'composer', 'toolbarItalicButton');
    await insertReplyText(page, " not italic");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await click(page, 'composer', 'toolbarNumberedList');
    await insertReplyText(page, "Numbered 1");
    await page.keyboard.press("Enter");
    await insertReplyText(page, "Numbered 2");
    await page.keyboard.press("Enter");
    await insertReplyText(page, "[AUTOTEST] formatted reply with lists");
    await clickSendButton(page);
    await expectTimelineContainsText(page, "[AUTOTEST] formatted reply with lists");
}

if (!queueMode) {
  test.describe("Toggle basic formatting controls in the reply composer and send a formatted message", () => {
    test('demo-composer-formatting', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}