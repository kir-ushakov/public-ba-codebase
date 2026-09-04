#!/usr/bin/env node
/**
 * Generate certs if needed, boot docker-compose.smoke.yml, wait until HTTPS backend answers.
 */
import https from 'https';
import { compose, ensureCerts, SMOKE_BASE_URL } from './compose.mjs';

const agent = new https.Agent({ rejectUnauthorized: false });

function ping() {
  return new Promise((resolve, reject) => {
    const req = https.request(SMOKE_BASE_URL, { method: 'GET', agent }, res => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('error', reject);
    req.end();
  });
}

async function waitForBackend(timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const status = await ping();
      if (status === 200) {
        console.log(`[smoke-up] backend up at ${SMOKE_BASE_URL}`);
        return;
      }
    } catch {
      // still booting
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.error(`[smoke-up] backend not reachable at ${SMOKE_BASE_URL} within ${timeoutMs}ms`);
  process.exit(1);
}

ensureCerts();
const upStatus = compose('up', '-d', '--build');
if (upStatus !== 0) {
  process.exit(upStatus);
}
await waitForBackend();
