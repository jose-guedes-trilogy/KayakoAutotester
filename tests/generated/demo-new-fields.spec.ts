import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await setCustomField(page, {"type":"radio","label":"Radio"} as any);
    await setCustomField(page, {"type":"text","label":"Text","value":"Sample single-line text"} as any);
    await setCustomField(page, {"type":"textarea","label":"Multiline text","value":"Line 1\nLine 2\nLine 3"} as any);
    await setCustomField(page, {"type":"regex","label":"Regex","value":"ABC-123"} as any);
    await setCustomField(page, {"type":"integer","label":"Integers","value":42} as any);
    await setCustomField(page, {"type":"decimal","label":"Decimals","value":123.45} as any);
    await setCustomField(page, {"type":"checkbox","label":"Checkboxes","value":["Option-A-Title","Option-B-Title"]} as any);
    await page.waitForTimeout(2000);
}

if (!queueMode) {
  test.describe("Fill all newly supported field types (radio, text, textarea, regex, integer, decimal, checkboxes)", () => {
    test('demo-new-fields', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}