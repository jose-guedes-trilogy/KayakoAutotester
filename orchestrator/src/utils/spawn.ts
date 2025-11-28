import { spawn, SpawnOptions } from 'child_process';

export function spawnNpx(args: string[], options: SpawnOptions & { onStdout?: (c: Buffer) => void; onStderr?: (c: Buffer) => void } = {}) {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  if (child.stdout && options.onStdout) child.stdout.on('data', options.onStdout);
  if (child.stderr && options.onStderr) child.stderr.on('data', options.onStderr);
  return child;
}

export function spawnNpm(args: string[], options: SpawnOptions & { onStdout?: (c: Buffer) => void; onStderr?: (c: Buffer) => void } = {}) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
  if (child.stdout && options.onStdout) child.stdout.on('data', options.onStdout);
  if (child.stderr && options.onStderr) child.stderr.on('data', options.onStderr);
  return child;
}



