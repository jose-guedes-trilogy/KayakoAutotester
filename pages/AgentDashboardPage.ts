import type { Page } from '@playwright/test';
import { click, expectVisible } from '../selectors';
import { createLogger } from '../lib/logger';

const log = createLogger('AgentDashboardPage');

export class AgentDashboardPage {
  constructor(private readonly page: Page) {}

  async openConversations(): Promise<void> {
    log.info('Opening Conversations inbox');
    await expectVisible(this.page, 'nav', 'conversationsLink');
    await click(this.page, 'nav', 'conversationsLink');
  }
}






