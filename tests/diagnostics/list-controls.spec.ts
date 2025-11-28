import { test } from '@playwright/test';
import { createLogger } from '../../lib/logger';
import { env } from '../../config/env';
import { LoginPage } from '../../pages/LoginPage';

const log = createLogger('diag-controls');

test('list buttons/links on conversation view', async ({ page }) => {
	const login = new LoginPage(page);
	await login.login(process.env.KAYAKO_USERNAME!, process.env.KAYAKO_PASSWORD!);
	await page.goto(`${env.KAYAKO_CONVERSATIONS_URL.replace(/\/$/, '')}/view/1`);
	try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}

	const data = await page.evaluate(() => {
		const getVisible = (el: Element) => {
			const r = (el as HTMLElement).getBoundingClientRect();
			return r.width > 0 && r.height > 0 && getComputedStyle(el as HTMLElement).visibility !== 'hidden';
		};
		const buttons = Array.from(document.querySelectorAll('button'))
			.filter(getVisible)
			.map((b) => (b as HTMLButtonElement).innerText.trim() || (b as HTMLButtonElement).getAttribute('aria-label') || '[no label]')
			.slice(0, 100);
		const roleButtons = Array.from(document.querySelectorAll('[role="button"]'))
			.filter(getVisible)
			.map((b) => (b as HTMLElement).innerText.trim() || (b as HTMLElement).getAttribute('aria-label') || '[no label]')
			.slice(0, 100);
		const links = Array.from(document.querySelectorAll('a'))
			.filter(getVisible)
			.map((a) => (a as HTMLAnchorElement).innerText.trim() || (a as HTMLAnchorElement).getAttribute('aria-label') || a.getAttribute('href') || '[no label]')
			.slice(0, 100);
		return { buttons, roleButtons, links };
	});
	log.info('Buttons: %o', data.buttons);
	log.info('RoleButtons: %o', data.roleButtons);
	log.info('Links: %o', data.links);
});
