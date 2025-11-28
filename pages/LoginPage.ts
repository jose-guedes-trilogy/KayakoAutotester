import type { Page } from '@playwright/test';
import { click, fill, expectVisible } from '../selectors';
import { env } from '../config/env';
import { createLogger } from '../lib/logger';

const log = createLogger('LoginPage');

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    const loginUrl = `${env.KAYAKO_AGENT_URL.replace(/\/$/, '')}/login`;
    log.info('Navigating to login page', loginUrl);
    await this.page.goto(loginUrl);
  }

  async login(username: string, password: string): Promise<void> {
    await this.goto();
    await fill(this.page, 'login', 'emailInput', username);
    await fill(this.page, 'login', 'passwordInput', password);
    await click(this.page, 'login', 'submitButton');
    await expectVisible(this.page, 'nav', 'conversationsLink');
  }
}


