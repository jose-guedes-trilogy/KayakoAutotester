/* eslint-disable @typescript-eslint/no-var-requires */
import { test } from '../../fixtures/auth.fixture';
import { accessConversation } from '../../selectors';

const queueEnv = (process.env.KAYAKO_QUEUE || '').split(',').map((t) => t.trim()).filter((t) => t.length > 0);

test.describe('Queued flows', () => {
  test('run queued flows serially', async ({ authenticatedPage }) => {
    test.skip(queueEnv.length === 0, 'No queued flows configured');
    for (const name of queueEnv) {
      const safe = name.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safe) {
        throw new Error(`Invalid queued test name: ${name}`);
      }
      await test.step(`Flow: ${safe}`, async () => {
        const mod = require(`../generated/${safe}.spec`);
        const runner = (mod as any).runFlow;
        if (typeof runner !== 'function') {
          throw new Error(`Flow "${safe}" does not export runFlow(page)`);
        }
        // Ensure we are already on a conversation to avoid unnecessary reloads between flows
        await accessConversation(authenticatedPage);
        await runner(authenticatedPage);
      });
    }
  });
});


