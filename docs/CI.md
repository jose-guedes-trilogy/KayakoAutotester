## CI Pipeline

- Workflow: `.github/workflows/e2e.yml`
- Runs on PRs (smoke only) and on `main` (same by default; extend as needed).
- Secrets required:
  - `KAYAKO_BASE_URL`
  - `KAYAKO_AGENT_URL`
  - `KAYAKO_USERNAME`
  - `KAYAKO_PASSWORD`
- Artifacts: Playwright HTML report and raw test-results.






