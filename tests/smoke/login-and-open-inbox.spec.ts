import { test, expect } from '../../fixtures/auth.fixture';
import { AgentDashboardPage } from '../../pages/AgentDashboardPage';

test.describe('Smoke: Login and open inbox', () => {
  test('@smoke login and navigate to conversations', async ({ authenticatedPage: page }) => {
    const dashboard = new AgentDashboardPage(page);
    await dashboard.openConversations();
    await expect(page).toHaveURL(/conversations/);
  });
});


