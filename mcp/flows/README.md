# MCP Flow Capture

1. Use Cursor’s Browser MCP to manually exercise a flow in the Kayako agent UI.
2. Record the steps into a YAML file under this directory using `schema.yml` as the contract.
3. Reference selectors by `group.key` from `selectors/selectors.jsonc`.
4. Keep credentials and URLs as `env.*` tokens; the converter will resolve them from `config/env.ts`.

Example: see `login-and-open-inbox.yml`.






