import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await expectVisible(page, 'composer', 'editor');
    await switchToReplyMode(page);
    await insertReplyText(page, "[AUTOTEST] Demo reply text");
    await addTags(page, ["demo","automation"]);
    await setStatus(page, "Pending");
    await page.waitForTimeout(5000);
}

if (!queueMode) {
  test.describe("Demonstrate basic reusable actions (reply text, tags, status)", () => {
    test('demo-basic-capabilities', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}