import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await setCustomField(page, { type: "radio", label: "Radio", value: undefined, path: undefined } as any);
    await setCustomField(page, { type: "text", label: "Text", value: "Sample single-line text", path: undefined } as any);
    await setCustomField(page, { type: "textarea", label: "Multiline text", value: "Line 1\nLine 2\nLine 3", path: undefined } as any);
    await setCustomField(page, { type: "regex", label: "Regex", value: "ABC-123", path: undefined } as any);
    await setCustomField(page, { type: "integer", label: "Integers", value: 42, path: undefined } as any);
    await setCustomField(page, { type: "decimal", label: "Decimals", value: 123.45, path: undefined } as any);
    await setCustomField(page, { type: "checkbox", label: "Checkboxes", value: ["Option-A-Title","Option-B-Title"], path: undefined } as any);
    await expectFieldValue(page, "Text", "Sample single-line text" as any);
    await expectFieldValue(page, "Multiline text", "Line 1\nLine 2\nLine 3" as any);
    await expectFieldValue(page, "Regex", "ABC-123" as any);
    await expectFieldValue(page, "Integers", 42 as any);
    await expectFieldValue(page, "Decimals", 123.45 as any);
    await expectFieldValue(page, "Checkboxes", ["Option-A-Title","Option-B-Title"] as any);
    await page.waitForTimeout(2000);
}

if (!queueMode) {
  test.describe("Fill all newly supported field types (radio, text, textarea, regex, integer, decimal, checkboxes)", () => {
    test('demo-new-fields', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}