import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText, selectFromDropdown, addTags, insertReplyText, switchToReplyMode, switchToInternalNoteMode, clickSendButton, setStatus, setTriggerConditionStatus, setTriggerActionStatus, setCustomField, setMultipleCustomFields, applyTagsStatusAndReply, expectStatusLabel, expectTagsContain, expectFieldValue, expectTimelineContainsText, expectRequest, accessConversation, applyMacroSendToCustomer, createNewTicket, completeConversation, trashConversation, reopenConversation } from '../../selectors';

const queueMode = process.env.KAYAKO_RUN_MODE === 'queue';

export async function runFlow(page: Page): Promise<void> {
    await accessConversation(page);
    await setCustomField(page, { type: "yesno", label: "Yes/no toggle", value: true, path: undefined } as any);
    await setCustomField(page, { type: "cascading", label: "Cascading select", value: undefined, path: ["Category-A","Subcategory-A","Item-1"] } as any);
    await setCustomField(page, { type: "date", label: "Date of purchase", value: "2025-04-05", path: undefined } as any);
    await setCustomField(page, { type: "radio", label: "Radio", value: undefined, path: undefined } as any);
    await setCustomField(page, { type: "text", label: "Text", value: "Sample single-line text", path: undefined } as any);
    await setCustomField(page, { type: "textarea", label: "Multiline text", value: "Line 1\nLine 2\nLine 3", path: undefined } as any);
    await setCustomField(page, { type: "regex", label: "Regex", value: "ABC-123", path: undefined } as any);
    await setCustomField(page, { type: "integer", label: "Integers", value: 42, path: undefined } as any);
    await setCustomField(page, { type: "decimal", label: "Decimals", value: 123.45, path: undefined } as any);
    await setCustomField(page, { type: "checkbox", label: "Checkboxes", value: ["Option-A-Title","Option-B-Title"], path: undefined } as any);
    await expectFieldValue(page, "Yes/no toggle", "Yes" as any);
    await expectFieldValue(page, "Cascading select", "Category-A / Subcategory-A / Item-1" as any);
    await expectFieldValue(page, "Text", "Sample single-line text" as any);
    await expectFieldValue(page, "Multiline text", "Line 1\nLine 2\nLine 3" as any);
    await expectFieldValue(page, "Regex", "ABC-123" as any);
    await expectFieldValue(page, "Integers", 42 as any);
    await expectFieldValue(page, "Decimals", 123.45 as any);
    await expectFieldValue(page, "Checkboxes", ["Option-A-Title","Option-B-Title"] as any);
    await page.waitForTimeout(3000);
}

if (!queueMode) {
  test.describe("Demonstrate setting yes/no, cascading select (multi-level), and date fields", () => {
    test('demo-custom-fields', async ({ authenticatedPage: page }) => {
      await runFlow(page);
    });
  });
}