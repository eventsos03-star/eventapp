import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = process.env.PORT ?? '5000';
const HEALTH = `http://127.0.0.1:${PORT}/health`;
const POLL_MS = 500;
const MAX_ATTEMPTS = 120;

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

async function main() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`Smoke test requires: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let logs = '';
  child.stdout.on('data', (chunk) => (logs += chunk));
  child.stderr.on('data', (chunk) => (logs += chunk));

  let done = false;
  function finish(ok, message) {
    if (done) return;
    done = true;
    if (ok) {
      console.log(message);
    } else {
      process.exitCode = 1;
      console.error(message);
      const tail = logs.split('\n').filter(Boolean).slice(-30).join('\n');
      console.error('[server output]\n' + tail);
    }
    child.kill();
  }

  child.on('exit', (code) => {
    if (!done) finish(false, `Server exited early with code ${code} before becoming healthy.`);
  });

  for (let attempt = 0; attempt < MAX_ATTEMPTS && !done; attempt += 1) {
    try {
      const response = await fetch(HEALTH, { signal: AbortSignal.timeout(2000) });
      if (response.ok) {
        finish(true, `Smoke test passed: ${HEALTH} -> HTTP ${response.status}`);
        break;
      }
    } catch {
      // not ready yet, keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  if (!done) {
    finish(false, `Server did not become healthy at ${HEALTH} within ${(MAX_ATTEMPTS * POLL_MS) / 1000}s.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});