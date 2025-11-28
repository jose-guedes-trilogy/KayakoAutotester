import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await dispatchClickCss(page, 'brand', 'changeBrandTrigger');
    await page.waitForTimeout(200);
    await dispatchClickText(page, "env.KAYAKO_BRAND_NAME");
    try {
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
    } catch (e) { console.warn('Optional step failed (wait-loadstate)', e); }
}

if (!queueMode) {
  test.describe("Change the conversation brand using env.KAYAKO_BRAND_NAME", () => {
    test('change-brand-to-env', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}