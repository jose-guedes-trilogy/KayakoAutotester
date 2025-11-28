import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible } from '../../selectors';

test.describe("Agent logs in and opens the first conversation from inbox", () => {
  test('open-first-conversation', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await expectVisible(page, 'nav', 'conversationsLink');
    await click(page, 'nav', 'conversationsLink');
    await expectVisible(page, 'inbox', 'firstItem');
    await click(page, 'inbox', 'firstItem');
    await expectVisible(page, 'conversation', 'subjectHeading');
  });
});