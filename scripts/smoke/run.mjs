#!/usr/bin/env node
/**
 * Boots docker-compose.smoke.yml, runs http-smoke.mjs, then tears down.
 * Cross-platform (Windows / Linux / macOS) via docker + node.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPOSE_FILE, COMPOSE_PROJECT, compose, ensureCerts, run } from './compose.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEEP_UP = process.env.SMOKE_KEEP_UP === '1';

ensureCerts();

let smokeStatus = 1;
try {
  const upStatus = compose('up', '-d', '--build');
  if (upStatus !== 0) {
    process.exit(upStatus);
  }

  smokeStatus = run(process.execPath, [path.join(__dirname, 'http-smoke.mjs')], {
    env: {
      ...process.env,
      SMOKE_COMPOSE_FILE: COMPOSE_FILE,
      SMOKE_COMPOSE_PROJECT: COMPOSE_PROJECT,
      SMOKE_BASE_URL: 'https://127.0.0.1:3443',
    },
  });

  if (smokeStatus === 0) {
    console.log('[smoke-run] PASSED');
  }
} finally {
  if (!KEEP_UP) {
    compose('down', '-v');
  } else {
    console.log('[smoke-run] SMOKE_KEEP_UP=1 — leaving stack running');
  }
}

process.exit(smokeStatus);
