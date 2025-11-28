import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible } from '../../selectors';

test.describe("Agent opens first conversation and assigns it to self", () => {
  test('assign-to-me', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await expectVisible(page, 'inbox', 'conversationSubject');
    await click(page, 'inbox', 'conversationSubject');
    await expectVisible(page, 'conversation', 'subjectHeading');
    await page.waitForTimeout(1500);
    await click(page, 'assign', 'assignToMeTrigger');
    await expectVisible(page, 'assign', 'confirmation');
  });
});