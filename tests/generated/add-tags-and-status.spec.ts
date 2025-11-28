import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await addTags(page, ["autotest-tag","autotest-tag-2"]);
    await setStatus(page, "Pending");
    await page.waitForTimeout(200);
    await expectStatusLabel(page, "Pending");
}

if (!queueMode) {
  test.describe("Add a couple of tags and set status to Pending", () => {
    test('add-tags-and-status', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}