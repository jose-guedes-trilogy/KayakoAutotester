## Automation Capabilities & Governance

### Primitive Actions (selectors/index.ts)

| Category | Primitive | Notes |
|----------|-----------|-------|
| Navigation | `accessConversation`, `goto-conversation-by-env-id` step | Uses env ID fallback + inbox open |
| Composer | `insertReplyText`, `switchToReplyMode`, `switchToInternalNoteMode`, `clickSendButton`, `addTags`, `applyTagsStatusAndReply` | `switchToInternalNoteMode` & `clickSendButton` newly added for composables |
| Status / properties | `setStatus`, `setCustomField`, `setCustomFieldAuto`, `setMultipleCustomFields`, `openDateCalendar*`, `findInfoBarField*` | Covers cascading/date controls |
| Assignee | `switchAssigneeTeamAndSave`, `logAssigneeValues`, `assignToMe` via existing helper | |
| Macros | `applyMacroSendToCustomer` | Extendable for other macros |
| Assertions | `expectStatusLabel`, `expectTagsContain`, `expectFieldValue` | |
| Network/utility | `waitForRequestMatch`, `collectRequestsDuring`, `expectRequest`, dispatcher helpers | |

Primitive list doubles as the canonical reference for composite flows—each primitive must be idempotent, log its selector usage, and live in `selectors/index.ts`.

### Composite Actions (YAML building blocks – planned location: `mcp/flows/components/`)

| Composite | Steps (primitives) |
|-----------|--------------------|
| `add-internal-note` | `switchToInternalNoteMode` → `insertReplyText` → `clickSendButton` |
| `change-properties-and-send` | `setStatus` / `setCustomField` → `clickSendButton` (captures property panel updates) |
| `apply-macro-and-close` | `applyMacroSendToCustomer` → `setStatus` → `clickSendButton` → `switchAssigneeTeamAndSave` |
| `assign-and-reply` | `switchAssigneeTeamAndSave` → `insertReplyText` → `clickSendButton` |

Composite definitions should reference primitives by name for traceability, and each YAML snippet should include comments noting required selectors/groups.

### Flow/Test Generation (scripts/flow-to-pw.ts + scripts/generate-tests.ts)

- Supported steps: `goto`, `wait`, `press`, `click`, `dispatch-click`, `dispatch-click-text`, `goto-conversation-by-env-id`, composer primitives, tag/status/property setters, assertions (`assert-tags-contain`, `assert-status`, `assert-field-value`), `expect-screenshot`, network assertions.
- Crawl-driven generation: `scripts/generate-tests.ts` reads `storage/map/graph.json`, applies regex/tag filters, emits YAML under `mcp/flows/autogen`, and runs the converter to produce specs. Composite actions will be referenced by name inside these flows as the generator evolves.

### Crawl → Capture → Suggest → Generate

| Stage | Command | Output |
|-------|---------|--------|
| Crawl graph | `npm run crawl:kayako` | `storage/map/graph.json` |
| Structure capture | `npm run capture:structure` | `artifacts/structure/<crawlId>/*.html/*.png` |
| Selector suggestions | `npm run selectors:suggest` | `selectors/extracted/pending.json` |
| Test generation | `npm run generate:tests` | `mcp/flows/autogen/*.yml`, `tests/generated/*.spec.ts` |
| Execution/reporting | Orchestrator commands or UI | Runs metadata, HTML reports, `/api/reporting` metrics |

### Governance & SOP

- **Selector review**
  1. Run `npm run selectors:suggest` after capturing structure.
  2. Promote high-signal selectors into `selectors/selectors.jsonc` with comments + `[class*=` priority.
  3. Update `docs/SELECTORS.md` and `docs/OBSERVATIONS.md`.
  4. Validate via `npm run validate:selectors`.
- **Primitive/composite maintenance**
  - Document new primitives in this file and implement them in `selectors/index.ts`.
  - Store composite YAML snippets under `mcp/flows/components` (coming soon) and reference them from flows/tests.
- **Flow/test lifecycle**
  1. Generate flows/specs with `npm run generate:tests` (use `--include`/`--tags`).
  2. Commit reusable flows; keep transient ones in `autogen`.
  3. Dashboard shows generated spec count + crawl freshness; ensure new specs are reviewed.
- **Logging & context**
  - Ensure `RUN_ID`, `KAYAKO_CRAWL_ID`, `KAYAKO_FLOW_ID` environment vars are set for every run/test.
  - Keep sensitive data out of selector files; document in `docs/OBSERVATIONS.md`.
- **CI (planned)**
  - Nightly job chaining crawl → capture → suggest → generate → test, storing artifacts per crawl ID.

### Run Controls (orchestrator + UI)

- Start/stop runs with custom queues, headed/headless, ticket overrides (`KAYAKO_CONVERSATION_ID`).
- Live SSE logs, video links, per-run HTML reports under `runs/<RUN_ID>/`.
- Dashboard “Automation Status” (React UI) displays crawl stats, capture freshness, selector backlog, generated spec counts, and run pass/fail totals (refreshes via `/api/reporting`).

> Keep this document updated whenever helper APIs/composites change or new governance policies are introduced. Use it for onboarding anyone working on selectors/tests.

