# MCP Flow Capture

1. Use Cursor’s Browser MCP to manually exercise a flow in the Kayako agent UI.
2. Record the steps into a YAML file under this directory using `schema.yml` as the contract.
3. Reference selectors by `group.key` from `selectors/selectors.jsonc`.
4. Keep credentials and URLs as `env.*` tokens; the converter will resolve them from `config/env.ts`.

Example base flow: `login-and-open-inbox.yml`.

## Composite building blocks

- Store reusable action snippets in `mcp/flows/composites/`. Current catalog:
  - `composite-add-internal-note`
  - `composite-change-properties-and-send`
  - `composite-apply-macro-and-close`
- Each composite references primitive steps (see `docs/CAPABILITIES.md`). Include them via copy/paste or future generator support.

Run `ts-node scripts/flow-to-pw.ts mcp/flows/composites/<file>.yml` to convert composite flows into Playwright specs for targeted testing.






