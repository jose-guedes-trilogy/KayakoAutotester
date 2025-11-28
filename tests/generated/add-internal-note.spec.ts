import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible } from '../../selectors';

test.describe("Agent opens first conversation and adds an internal note", () => {
  test('add-internal-note', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await expectVisible(page, 'conversation', 'subjectHeading');
    await page.waitForTimeout(1500);
    await click(page, 'composer', 'editor');
    await click(page, 'composer', 'internalNoteToggle');
    await fillSel(page, 'composer', 'editor', "[AUTOTEST] Internal note added by MCP");
    await click(page, 'composer', 'addNoteButton');
    await expectVisible(page, 'conversation', 'timelineEntry');
  });
});