# Kayako Autotester

This repository contains a collection of Playwright-based automation flows, selector governance tooling, and helper scripts used to validate and interact with a Kayako agent environment. It is designed to be both an execution harness for end-to-end tests and a source of truth for the resilient selectors those tests rely on.

---

## Top-Level Layout

```
.
├── artifacts/           # Generated assets (HTML dumps, screenshots, etc.)
├── config/              # Playwright configuration and env loading
├── docs/                # Selector governance, capabilities, observations
├── lib/                 # Shared utilities such as structured logging
├── mcp/flows/           # YAML flows (Cursor MCP / Playwright generators)
├── orchestrator/        # Orchestration server powering flow execution
├── pages/               # Page Object helpers for Playwright tests
├── scripts/             # Node/TS helper scripts (selectors, HTML dumps…)
├── selectors/           # Selector registry, schema, HUD helpers
├── tests/               # Playwright specs (smoke, generated, diagnostics)
├── ui/                  # Lightweight dashboard for monitoring runs
└── storage/             # Playwright storage states and run metadata
```

Key npm scripts are defined in `package.json` (e.g., `npm run test`, `npm run validate:selectors`, `npm run extract:selectors`).

---

## Automation Pipeline Overview

1. **Crawl & Map (upcoming `scripts/crawl-kayako.ts`)** – traverse the agent UI, resolve nav graph, and capture metadata for each URL.
2. **Capture Structure (`scripts/capture-structure.ts` + `scripts/dump-page-html.ts`)** – log in once, sanitize DOM, emit full-page HTML, targeted sections, screenshots, and diff-friendly artifacts across the crawl set.
3. **Selector Expansion (`scripts/extract-selectors.ts` + `scripts/suggest-selectors.ts`)** – mine source & captured HTML for resilient selectors and stage proposals in `selectors/extracted/`.
4. **Test Generation (`scripts/generate-tests.ts` + `scripts/flow-to-pw.ts`)** – map crawl URLs to flows (or fallback templates) and generate Playwright specs under `tests/generated/`.
5. **Execution & Reporting (`orchestrator/`, `ui/`)** – run tests headless or headed, stream HUD/logs with crawl/test IDs, persist run metadata in `storage/runs.json`, and surface results in the dashboard.
6. **Governance** – docs (`docs/SELECTORS.md`, `docs/OBSERVATIONS.md`) describe selector coverage, SPA quirks, and next actions. CI will eventually chain crawl → capture → selectors → tests → execution.

## Execution Flow

1. **Environment Setup**  
   - Populate `.env.local` with the Kayako credentials/URLs (see `config/env.ts` for required vars).  
     - Required: `KAYAKO_BASE_URL`, `KAYAKO_AGENT_URL`, `KAYAKO_USERNAME`, `KAYAKO_PASSWORD`.  
     - Optional: `KAYAKO_CONVERSATION_ID` (forces tests to open a specific ticket), `KAYAKO_PREFERRED_TEAM`, and `KAYAKO_INBOX_VIEW_ID` (defaults to `1`, drives which inbox view URL the tests open via the derived `KAYAKO_INBOX_VIEW_URL`).
   - Install dependencies with `npm install`.

2. **Selectors as Source of Truth**  
   - Selectors live in `selectors/selectors.jsonc`, validated against `selectors/selectors.schema.json`.
   - Use `npm run validate:selectors` to enforce schema coverage, unique selector strings, and comments.
   - Supporting docs (`docs/SELECTORS.md`, `docs/OBSERVATIONS.md`) summarize current coverage and rationale.

3. **Playwright Tests**  
   - Fixtures (`fixtures/auth.fixture.ts`) handle login + storage state.
   - Page Objects (`pages/LoginPage.ts`, `pages/AgentDashboardPage.ts`) encapsulate common flows.
   - Specs under `tests/` consume selectors via helper utilities in `selectors/index.ts`.

4. **Orchestrator and UI**  
   - `orchestrator/` hosts a service that coordinates flows (used by dashboards/MCP integrations).
   - `ui/` exposes a minimal dashboard for observing runs (optional).

---

## Selector Tooling

- **`scripts/extract-selectors.ts`**  
  Scans the Ember app (`kayako-frontend-cp-master/`) for CSS-module and QA hooks. Outputs deduplicated selectors under `selectors/extracted/`.

- **`scripts/suggest-selectors.ts`**  
  Parses sanitized HTML produced by the structure capture runner, identifies hashed CSS-module class bases (e.g., `ko-info-bar_field_select__trigger_`), filters out selectors already present in `selectors/selectors.jsonc`, and writes review-ready suggestions to `selectors/extracted/pending.json` (sorted by occurrence count, including sample files for context). Run via `npm run selectors:suggest`.

- **`scripts/generate-tests.ts`**  
  Reads the crawl graph (`storage/map/graph.json`), matches URLs against existing flow YAML definitions (or a default fallback), emits per-URL flow files under `mcp/flows/autogen/`, and invokes `scripts/flow-to-pw.ts` to produce Playwright specs. Supports filters (`--crawl-id`, `--include`, `--tags`) and is exposed via `npm run generate:tests`.

- **`selectors/index.ts`**  
  Runtime selector utilities: lazy loading, HUD integration, resilient fallbacks (frame-aware), and helper flows for interacting with complex controls (assignments, tags, macros, etc.).

- **HUD + Logging**  
  `selectors/hud.ts` and `lib/logger.ts` work together to show live feedback (e.g., which selector fallback was used) and forward logs to the orchestrator.

---

## HTML Extraction & Diffing

To simplify HTML inspections and selector authoring, use `scripts/dump-page-html.ts`. This Playwright-powered helper logs into the Kayako agent UI, sanitizes the DOM, and writes cleaned HTML to `artifacts/html/`.

### Features

| Flag            | Purpose                                                                                          |
|-----------------|--------------------------------------------------------------------------------------------------|
| `--url`         | Target path or full URL (defaults to `/agent/conversations/view/1`).                             |
| `--output`      | Destination file (defaults to `artifacts/html/dump-<timestamp>.html`).                           |
| `--headless`    | Set to `false` to launch a headed browser for debugging.                                         |
| `--click`       | Repeatable. Runs custom clicks (CSS selectors) before capture—useful for opening dropdowns.      |
| `--section`     | Repeatable. Captures the sanitized `outerHTML` of matching nodes into separate `.section-*.html`.|

### Example

```bash
npx ts-node scripts/dump-page-html.ts \
  --url=/agent/conversations/35 \
  --output=artifacts/html/conversation-35.html \
  --click="[class*='ko-info-bar_field_select__trigger_']" \
  --section="[class*='ko-info-bar_item__container_']" \
  --section="[class*='ko-checkbox__checkboxWrap_']"
```

This generates:

- `conversation-35.html` — entire sanitized page.
- `conversation-35.section-1-class-ko-info-bar-item-container.html` — right-side field blocks.
- `conversation-35.section-2-class-ko-checkbox-checkboxwrap.html` — checkbox groups only.

Because scripts/styles/meta/link/svg nodes are stripped in-page, Git diffs stay small and highlight only meaningful UI changes.

## Crawl & Mapping Service

Use `scripts/crawl-kayako.ts` (or `npm run crawl:kayako`) to build and persist a navigation graph of the Kayako agent UI. The crawler:

- Logs in via `LoginPage`, then breadth-first visits URLs that match the origin and optional include/exclude patterns.
- Records node metadata (status, depth, parent, children) and adjacency edges.
- Writes results to `storage/map/graph.json`, maintaining multiple crawl sessions keyed by `crawlId`.
- Accepts `--crawl-id` to resume/update an existing crawl, otherwise generates a timestamped ID (e.g., `crawl-2025-11-26t13-50-00-000z`).

### CLI Flags

| Flag | Description |
|------|-------------|
| `--seeds=/agent/conversations,/agent/users` | Comma-separated or repeatable seed URLs. Defaults to inbox. |
| `--max-depth=2` | Limit traversal depth (root seed = depth 0). |
| `--include=<regex>` / `--exclude=<regex>` | Repeatable regex filters applied to canonical URLs. |
| `--headless=false` | Run headed (defaults to true). |
| `--delay=250` | Delay (ms) between visits. |
| `--crawl-id=my-crawl` | Override generated crawl ID; reuse to resume. |

Example:

```bash
npm run crawl:kayako -- --seeds=/agent/conversations --max-depth=1 --include="/agent/conversations" --crawl-id=crawl-conversations
```

After the crawl, inspect `storage/map/graph.json` to see the discovered nodes and use the IDs elsewhere (e.g., set `KAYAKO_CRAWL_ID` before running HTML capture or tests so logs/artifacts align with the crawl).

## Structure Capture Runner

`scripts/capture-structure.ts` (or `npm run capture:structure`) walks the crawl graph (latest crawl by default) and, for each successful URL:

- Logs in once (reusing the same Playwright session).
- Opens the page, optionally fires custom clicks (`--click`) to expose dropdowns/modals.
- Saves sanitized full HTML, section snippets, and a full-page PNG under `artifacts/structure/<crawlId>/`.
- Tags artifacts/logs with `KAYAKO_CRAWL_ID` so downstream jobs can correlate them with the crawl.

### Flags

| Flag | Description |
|------|-------------|
| `--crawl-id=<id>` | Capture a specific crawl (defaults to `lastCrawlId`). |
| `--url=<single>` | Capture only a single URL (skip crawl graph). |
| `--input=<file>` | Provide a JSON array of URLs instead of using the crawl graph. |
| `--output=<dir>` | Override output directory (defaults to `artifacts/structure/<crawlId>`). |
| `--section=<css>` | Repeatable selectors to slice sections (defaults to info-bar + checkbox groups). |
| `--click=<css>` | Repeatable selectors clicked before capture. |
| `--headless=false` | Run headed. |
| `--screenshot=false` | Skip PNG capture. |

Example:

```bash
npm run capture:structure -- --crawl-id=crawl-conversations --section="[class*='ko-tabs__list_']"
```

## Autogenerated Tests

Run `scripts/generate-tests.ts` (or `npx ts-node scripts/generate-tests.ts`) to convert crawl metadata + composites into Playwright specs:

| Flag | Description |
|------|-------------|
| `--crawl-id=<id>` | Use URLs from a specific crawl record (defaults to `lastCrawlId`). |
| `--include=<regex>` | Only generate flows for URLs matching the regex (e.g., `/agent/conversations/view/`). |
| `--tags=a,b` | Attach tags to the default autogenerated flow. |
| `--composites=all` or `--composites=name1,name2` | Include the composite catalog (`mcp/flows/composites/`) when generating tests. |
| `--view-ids=1` / `--view-ids=2,5` / `--view-ids=all` | Restrict generated inbox “view” URLs to the listed numeric IDs (defaults to `1`; `all` keeps every view/page discovered). |

Example:

```bash
npx ts-node scripts/generate-tests.ts \
  --crawl-id=crawl-2025-11-26t15-01-56-077z \
  --include="/agent/conversations/view/" \
  --composites=all
```

The command writes YAML under `mcp/flows/autogen/` plus specs inside `tests/generated/`, one per URL and per composite (e.g., `composite-add-internal-note-<slug>.spec.ts`). Conversation list specs always navigate to `env.KAYAKO_INBOX_VIEW_URL`, which is computed from `KAYAKO_AGENT_URL` + `KAYAKO_INBOX_VIEW_ID` (default `1`). Override that env var at runtime to exercise another view without regenerating specs.

## Reporting & Dashboard

- Orchestrator endpoints now expose aggregated crawl/test metadata (`GET /api/reporting`, `GET /api/crawls`). The React dashboard (`ui/`) surfaces these metrics via an “Automation Status” card that shows crawl counts, latest structure capture, pending selector suggestions, generated spec count, and run pass/fail totals.
- Use `npm --prefix ui run dev` (or the combined `npm run control:dev`) to launch the dashboard; it fetches `/api/reporting` on load, and you can refresh manually to watch crawl/capture/test pipelines progress.
- CI hooks (planned) will chain: crawl (`npm run crawl:kayako`) → capture (`npm run capture:structure`) → selector suggestion review (`npm run selectors:suggest`) → test generation (`npm run generate:tests`) → execution. Each step tags artifacts with `KAYAKO_CRAWL_ID` so the dashboard and orchestrator APIs can present consistent reporting.

## Logging & Context Tags

All loggers (`lib/logger.ts`) automatically append run/test metadata when the following environment variables are present:

- `RUN_ID` – injected by the orchestrator; used to associate log lines with a stored run record.
- `KAYAKO_CRAWL_ID` – optional crawl/mapping identifier (set via orchestrator request `context.crawlId` or manually).
- `KAYAKO_FLOW_ID` – optional flow/template identifier used during generation/testing.

Sample prefix:

```
[2025-11-26T13:52:45.803Z] [INFO] [dump-html run=1234 crawl=crawl-20251126 flow=conversations]
```

When tests forward logs to the orchestrator (enabled automatically when `RUN_ID` is defined), the context tags ensure both the run dashboard and any downstream artifact processors can partition logs/artifacts per crawl or flow.

---

## Recent Enhancements

- **Section-aware HTML capture:** targeted snapshots enable before/after diffs for dropdowns, drawers, and nested components without storing the entire DOM twice.
- **Checkbox field selectors:** `info.checkboxGroup`, `info.checkboxLabel`, and `info.checkboxHeader` were added to `selectors/selectors.jsonc`, ensuring the Playwright helpers can reliably interact with multi-checkbox custom fields on the right-side info bar.
- **Context-aware logging:** `lib/logger.ts` now emits optional run/crawl/flow IDs (populated via env vars or orchestrator context) so artifacts can be correlated across the crawl → selectors → tests pipeline.

---

## Recommended Workflows

1. **Add or Update Selectors**
   - Run the conversation dump script for the relevant page/section.
   - Inspect the resulting `.section-*.html` files and update `selectors/selectors.jsonc`.
   - Document new keys in `docs/SELECTORS.md` and validate with `npm run validate:selectors`.

2. **Author New Flows**
   - Define the scenario in `mcp/flows/*.yml`.
   - Use `scripts/flow-to-pw.ts` to generate Playwright specs under `tests/generated/`.
   - Run `npm run test -- <spec>` or trigger via the orchestrator UI.

3. **Debug UI Issues**
   - Use `tests/diagnostics/*.spec.ts` (e.g., `list-controls`, `post-login-diag`) to log DOM state and console output.
   - Rely on the HUD/log data emitted by `selectors/index.ts` to identify brittle selectors or missing waits.

---

## Additional Resources

- `docs/CAPABILITIES.md` — Summary of what flows/tests currently cover.
- `docs/OBSERVATIONS.md` — Notes from debugging sessions (SPA quirks, iframe behavior, etc.).
- `docs/TEST-PLAN.md` — High-level roadmap (smoke, agent actions, admin flows).

For questions about the Kayako environment or to add new credentials, update `.env.local` and keep sensitive data out of version control.

---

Happy testing!

