import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto(env.KAYAKO_AGENT_URL);
    await expectVisible(page, 'nav', 'conversationsLink');
    await click(page, 'nav', 'conversationsLink');
    await expect(page).toHaveURL(new RegExp("conversations"));
}

if (!queueMode) {
  test.describe("Agent logs in and opens conversations inbox", () => {
    test('login-and-open-inbox', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}