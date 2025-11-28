## Selectors Governance

- Single source of truth: `selectors/selectors.jsonc`.
- Use resilient selectors, preferring `[class*=` matches or stable attributes (e.g., `data-`, `role`, `aria-`).
- Every key must have a concise comment describing purpose.
- Provide fallback chains (array) ordered from most to least preferred.
- Run `npm run validate:selectors` to enforce schema, duplicates, and comment presence.


