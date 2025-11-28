import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectRequest, accessConversation, applyMacroSendToCustomer } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await page.goto("https://trilogy-joseguedes.kayako.com/agent/conversations/view/2");
    await accessConversation(page);
    await setMultipleCustomFields(page, [{"fieldType":"yesno","label":"Yes/no toggle","value":true},{"fieldType":"date","label":"Date of purchase","value":"2025-04-05"},{"fieldType":"text","label":"Text","value":"Composite Text"},{"fieldType":"textarea","label":"Multiline text","value":"Composite\nFlow\nText"},{"fieldType":"integer","label":"Integers","value":77},{"fieldType":"decimal","label":"Decimals","value":9.99},{"fieldType":"checkbox","label":"Checkboxes","value":["Option-A-Title"]}] as any);
    await addTags(page, ["vip","follow-up"]);
    await setStatus(page, "Open");
    try {
    await expectRequest(page, {"urlPattern":"**/api/**","method":"POST","timeoutMs":5000} as any);
    } catch (e) { console.warn('Optional step failed (expect-request)', e); }
    await expectTagsContain(page, ["vip"]);
    { const r = await (await import('../../selectors')).firstAvailableLocator(page, 'info', 'panel'); await expect(r.locator).toHaveScreenshot("info-panel.png"); }
    await page.waitForTimeout(1000);
}

if (!queueMode) {
  test.describe("Composite demo - set multiple fields, add tags, set status, assert DOM, and snapshot (https://trilogy-joseguedes.kayako.com/agent/conversations/view/2)", () => {
    test('demo-smoke-trilogy-joseguedes-kayako-com-agent-conversations-view-2', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}