import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await (await import('../../selectors')).switchAssigneeTeamAndSave(page, ["VIP Account Team", "General"]);
    await (await import('../../selectors')).logAssigneeValues(page);
    await page.waitForTimeout(200);
}

if (!queueMode) {
  test.describe("Switch the assignee team (prefers VIP Account Team, then General) and save", () => {
    test('switch-assignee-and-save', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}