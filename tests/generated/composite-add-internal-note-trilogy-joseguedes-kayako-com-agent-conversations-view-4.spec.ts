import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation, applyMacroSendToCustomer } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto("https://trilogy-joseguedes.kayako.com/agent/conversations/view/4");
    await accessConversation(page);
    await switchToInternalNoteMode(page);
    await insertReplyText(page, "env.INTERNAL_NOTE_TEXT");
    await clickSendButton(page);
    await page.waitForTimeout(500);
}

if (!queueMode) {
  test.describe("Switch to internal note mode, add text, and send. (https://trilogy-joseguedes.kayako.com/agent/conversations/view/4)", () => {
    test('composite-add-internal-note-trilogy-joseguedes-kayako-com-agent-conversations-view-4', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}