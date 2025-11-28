import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { createLogger } from '../../lib/logger';

const log = createLogger('diag');

// Captures signals right after login to understand why post-login UI is not discoverable
// by selectors in this environment.
test('diagnose post-login rendering and DOM availability', async ({ page }) => {
	page.on('console', (msg) => {
		log.warn('Console[%s]: %s', msg.type(), msg.text());
	});
	page.on('pageerror', (err) => {
		log.error('PageError: %s', err?.message ?? err);
	});
	page.on('requestfailed', (request) => {
		log.error('RequestFailed: %s %s -> %s', request.method(), request.url(), request.failure()?.errorText);
	});

	const login = new LoginPage(page);
	await login.login(process.env.KAYAKO_USERNAME!, process.env.KAYAKO_PASSWORD!);

	// Give SPA time to mount; try multiple load states without failing hard
	try {
		await page.waitForLoadState('networkidle', { timeout: 15000 });
	} catch {}
	try {
		await page.waitForLoadState('load', { timeout: 10000 });
	} catch {}

	const title = await page.title();
	log.info('Title after login: %s', title);

	// Shallow DOM summary
	const summary = await page.evaluate(() => {
		const root = document.documentElement;
		const bodyChildren = Array.from(document.body?.children ?? []);
		return {
			url: location.href,
			rootTag: root?.tagName,
			bodyChildTags: bodyChildren.slice(0, 30).map((e) => e.tagName + (e.id ? `#${e.id}` : '') + (e.className ? `.${String(e.className).split(' ').join('.')}` : '')),
			childCount: bodyChildren.length,
		};
	});
	log.info('DOM summary: %o', summary);

	// Full-page screenshot for the HTML report
	await page.screenshot({ path: 'test-results/diag-post-login.png', fullPage: true });
	log.info('Saved screenshot to test-results/diag-post-login.png');
});
