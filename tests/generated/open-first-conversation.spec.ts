import { test, expect } from '../../fixtures/auth.fixture';
import { env } from '../../config/env';
import { click, fill as fillSel, expectVisible, dispatchClickCss, dispatchClickText } from '../../selectors';

test.describe("Agent logs in and opens the first conversation from inbox", () => {
  test('open-first-conversation', async ({ authenticatedPage: page }) => {
    await page.goto(env.KAYAKO_AGENT_URL);
    await page.goto(env.KAYAKO_CONVERSATIONS_URL);
    await page.goto("${env.KAYAKO_CONVERSATIONS_URL}/view/1");
    await expectVisible(page, 'conversation', 'subjectHeading');
  });
});