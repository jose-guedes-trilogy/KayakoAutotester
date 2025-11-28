import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation, applyMacroSendToCustomer } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto("https://trilogy-joseguedes.kayako.com/agent/conversations/view/4");
    await accessConversation(page);
    await applyMacroSendToCustomer(page);
    await switchToReplyMode(page);
    await clickSendButton(page);
    await setStatus(page, "Closed");
    await (await import('../../selectors')).switchAssigneeTeamAndSave(page, ['VIP Account Team','General']);
    await page.waitForTimeout(1000);
}

if (!queueMode) {
  test.describe("Apply macro, finalize reply, update status, and save assignee. (https://trilogy-joseguedes.kayako.com/agent/conversations/view/4)", () => {
    test('composite-apply-macro-and-close-trilogy-joseguedes-kayako-com-agent-conversations-view-4', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}