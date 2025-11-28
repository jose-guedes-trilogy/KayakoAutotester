## Secrets Workflow

- Author a plaintext JSON file (e.g., `secrets/kayako.json`) that contains the env vars you want to share securely. Use `secrets/kayako.sample.json` as a template.
- Encrypt it with:

```bash
KAYAKO_SECRETS_KEY="choose-a-strong-passphrase" \
  ts-node scripts/encrypt-secrets.ts secrets/kayako.json secrets/kayako.json.enc
```

- Commit **only** the `.enc` output (never the plaintext JSON). Share the passphrase out-of-band.
- Consumers decrypt with:

```bash
KAYAKO_SECRETS_KEY="same-passphrase" \
  ts-node scripts/decrypt-secrets.ts secrets/kayako.json.enc .env.from-secrets
```

or pass `--stdout` as the second argument to print to the console.

- Source the resulting file (or copy/paste keys) into your environment before running the automation pipeline.

