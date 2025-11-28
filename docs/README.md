## Kayako E2E Automation – Quickstart

1. Copy `.env.sample` to `.env.local` and fill values.
2. Install deps:
   - `npm ci`
   - `npx playwright install chromium`
3. Validate selectors: `npm run validate:selectors`
4. (Optional) Convert MCP flows: `npm run convert:flows`
5. Run smoke tests: `npm run test:smoke`

Generated reports live under `playwright-report/` and `test-results/`.






