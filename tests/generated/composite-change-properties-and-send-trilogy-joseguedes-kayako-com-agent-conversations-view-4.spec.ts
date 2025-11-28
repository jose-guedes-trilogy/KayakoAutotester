import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation, applyMacroSendToCustomer } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto("https://trilogy-joseguedes.kayako.com/agent/conversations/view/4");
    await accessConversation(page);
    await setStatus(page, "env.DEFAULT_STATUS");
    await setCustomField(page, {"type":"dropdown","label":"Priority","value":"env.DEFAULT_PRIORITY"} as any);
    await setCustomField(page, {"type":"text","label":"Text","value":"Updated via composite"} as any);
    await clickSendButton(page);
    await page.waitForTimeout(500);
}

if (!queueMode) {
  test.describe("Update ticket properties (status/custom fields) and send a reply. (https://trilogy-joseguedes.kayako.com/agent/conversations/view/4)", () => {
    test('composite-change-properties-and-send-trilogy-joseguedes-kayako-com-agent-conversations-view-4', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}