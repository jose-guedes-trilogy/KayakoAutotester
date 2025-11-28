## MCP Manual Testing Workflow

1. Use Cursor’s Browser MCP to navigate to `env.KAYAKO_AGENT_URL`.
2. Perform actions and note selectors by `group.key` from `selectors/selectors.jsonc`.
3. Save the flow as YAML in `mcp/flows/` following `mcp/flows/schema.yml`.
4. Convert to tests: `npm run convert:flows` → outputs to `tests/generated/`.
5. Promote stable generated tests into `tests/smoke/` or `tests/regression/` as needed.





