import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await (await import('../../selectors')).switchAssigneeTeamAndSave(page, ["VIP Account Team", "General"]);
    try {
    await (await import('../../selectors')).logAssigneeValues(page);
    } catch (e) { console.warn('Optional step failed (log-assignee)', e); }
    await page.waitForTimeout(5000);
}

if (!queueMode) {
  test.describe("Agent opens first conversation and assigns it to self", () => {
    test('assign-to-me', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}