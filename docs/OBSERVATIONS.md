## General observations

- Browser MCP reliability:
  - The agent login page sometimes renders fully (with accessible `textbox` fields and a visible Login button), and other times the snapshot shows mostly an iframe and images. This variability can cause brittle element discovery when running scripted steps without waits.
  - When the login UI is present, MCP works end-to-end: typing in email/password, submitting, seeing error messages, and navigating to Conversations succeeded.

- Playwright runner behavior:
  - In some sessions the DOM initially appears sparse; probes that immediately query for elements can fail before the SPA mounts. Adding short waits for `domcontentloaded` and for locators to become `attached` greatly improves stability.
  - Some UI content may appear within iframes. Searching only the main frame misses those elements. Expanding the search to `page.frames()` resolves this.

- Selectors governance:
  - Prefer resilient selectors: `role=` engines (Playwright), `[class*=]`, `data-*`, `aria-*`, and semantic attributes.
  - Provide ordered fallbacks and log when a fallback is used. This gives early warning of UI churn.

- Headless vs headed:
  - Headed often exposes different (friendlier) rendering behavior for dynamic apps. When encountering white/blank screens or empty snapshots in CI or local headless runs, retry with `--headed` and longer timeouts.

## Automation pipeline instrumentation

- Every Playwright process now reads `RUN_ID`, `KAYAKO_CRAWL_ID`, and `KAYAKO_FLOW_ID` (if defined) and appends them to logger prefixes. This makes it trivial to correlate HUD lines, orchestrator logs, and artifacts with a crawl or generated flow.
- The orchestrator accepts an optional `context` payload when starting a run; it persists those IDs in `storage/runs.json` and injects them into the Playwright environment so downstream tooling (HTML capture, selector extraction, screenshot diffing) can tag files deterministically.
- HTML capture scripts (`scripts/dump-page-html.ts`) and the structure runner (`scripts/capture-structure.ts`) should inherit `KAYAKO_CRAWL_ID` so console output and artifacts are grouped per crawl session.
- The crawler writes `storage/map/graph.json` with one record per crawl; the structure capture tool reads the same file to decide which URLs to snapshot. Keep this file under git so changes to the crawl map can be reviewed.
- Selector suggestion output (`selectors/extracted/pending.json`) must be triaged regularly. Treat it like a “lint” artifact—empty pending file should be the norm. Capture the date of the last triage in PR descriptions.

## Test-specific notes

- Login button gating (enablement):
  - The Login button can render disabled until both fields are populated. When probing for this button, wait for it to be attached first; then verify `enabled/disabled` states. The MCP snapshot includes `[disabled]` indicators which are useful.

- Invalid credentials error:
  - After submitting invalid credentials, a heading reads “Email and password combination is incorrect”. Prefer a role-based selector for this (`role=heading[name='Email and password combination is incorrect']`) and include a `text=` fallback.

- Forgot password navigation:
  - The destination URL varies by deployment/version. Use a flexible expectation like `/forgot|reset|password/i` instead of an exact path.

## Remediations implemented

- Selector resolution now waits for SPA boot and searches across all frames:
  - Added `waitForLoadState('domcontentloaded')` best-effort.
  - For each selector candidate, wait up to ~8s for `state: 'attached'` before declaring a miss.
  - If not found in the main page, probe all frames.

- Selectors upgraded to resilient forms in `selectors/selectors.jsonc`:
  - `login.emailInput`, `login.passwordInput`, `login.submitButton` now include `role=` engines with text-based fallbacks.
  - Added `login.rememberMeCheckbox`, `login.forgotPasswordLink`, `login.errorInvalidCombo` with stable fallbacks.

- Tests target explicit `/agent/login` to avoid timing/redirect ambiguity.

## Next steps if instability persists

- Run locally headed with more generous timeouts:
  - `npx playwright test --headed --timeout=60000`.
  - Optionally add `--debug` to step through.

- Add a page-level readiness check for known login text (e.g., “Welcome back to Kayako”) before probing fields.

- If the login form is consistently embedded in a known iframe, specialize selectors to that frame using `frameLocator()` (we can add a group for the login frame root if needed).

## Run tips

- Validate selectors: `npm run validate:selectors`
- Execute the three smoke tests (headed):
  - `npx playwright test -c config/playwright.config.ts --project=chromium --headed tests/smoke/login-button-enable.spec.ts tests/smoke/login-invalid.spec.ts tests/smoke/forgot-password-link.spec.ts`



