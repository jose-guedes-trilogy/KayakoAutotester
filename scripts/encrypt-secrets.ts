import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, createCipheriv } from 'crypto';

const DEFAULT_INPUT = path.join(process.cwd(), 'secrets', 'kayako.json');
const DEFAULT_OUTPUT = path.join(process.cwd(), 'secrets', 'kayako.json.enc');

function usage(): never {
  console.log(`Usage: KAYAKO_SECRETS_KEY=pass ts-node scripts/encrypt-secrets.ts [input.json] [output.json.enc]`);
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
    throw new Error(`Input secrets file not found: ${input}`);
  }
  const plaintext = fs.readFileSync(input);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(password, salt, 32);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
  await fs.promises.mkdir(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(payload, null, 2));
  console.log(`Encrypted secrets written to ${output}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


