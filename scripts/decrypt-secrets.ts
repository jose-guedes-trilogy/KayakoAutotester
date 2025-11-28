import fs from 'fs';
import path from 'path';
import { scryptSync, createDecipheriv } from 'crypto';

const DEFAULT_INPUT = path.join(process.cwd(), 'secrets', 'kayako.json.enc');
const DEFAULT_OUTPUT = path.join(process.cwd(), '.env.from-secrets');

type EncPayload = {
  version: number;
  salt: string;
  iv: string;
  tag: string;
  data: string;
};

function usage(): never {
  console.log(`Usage: KAYAKO_SECRETS_KEY=pass ts-node scripts/decrypt-secrets.ts [input.enc] [output.json|--stdout]`);
  process.exit(1);
}

async function main(): Promise<void> {
  const password = process.env.KAYAKO_SECRETS_KEY;
  if (!password || password.trim().length < 8) {
    console.error('KAYAKO_SECRETS_KEY env var is required (>=8 chars).');
    usage();
  }
  const input = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const output = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;
  if (!fs.existsSync(input)) {
    throw new Error(`Encrypted secrets file not found: ${input}`);
  }
  const payload = JSON.parse(fs.readFileSync(input, 'utf8')) as EncPayload;
  if (payload.version !== 1) {
    throw new Error(`Unsupported payload version: ${payload.version}`);
  }
  const salt = Buffer.from(payload.salt, 'base64');
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ciphertext = Buffer.from(payload.data, 'base64');
  const key = scryptSync(password, salt, 32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  if (output === '--stdout') {
    process.stdout.write(plaintext);
  } else {
    await fs.promises.writeFile(output, plaintext);
    console.log(`Secrets written to ${output}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


