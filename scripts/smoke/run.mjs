#!/usr/bin/env node
/**
 * Boots docker-compose.smoke.yml, runs http-smoke.mjs, then tears down.
 * Cross-platform (Windows / Linux / macOS) via docker + node.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const COMPOSE_FILE = 'docker-compose.smoke.yml';
const COMPOSE_PROJECT = 'ba-smoke';
const CERT_DIR = path.join(__dirname, 'certs');
const KEEP_UP = process.env.SMOKE_KEEP_UP === '1';

function run(cmd, args, opts = {}) {
  console.log(`[smoke-run] ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  return result.status ?? 1;
}

function ensureCerts() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  const crt = path.join(CERT_DIR, 'server.crt');
  const key = path.join(CERT_DIR, 'server.key');
  if (fs.existsSync(crt) && fs.existsSync(key)) {
    console.log('[smoke-run] reusing existing smoke TLS certs');
    return;
  }

  console.log('[smoke-run] generating self-signed TLS certs via openssl container');
  const status = run('docker', [
    'run',
    '--rm',
    '-v',
    `${CERT_DIR}:/certs`,
    'alpine/openssl',
    'req',
    '-x509',
    '-nodes',
    '-newkey',
    'rsa:2048',
    '-keyout',
    '/certs/server.key',
    '-out',
    '/certs/server.crt',
    '-days',
    '1',
    '-subj',
    '/CN=localhost',
  ]);
  if (status !== 0) {
    process.exit(status);
  }
}

function compose(...args) {
  return run('docker', ['compose', '-p', COMPOSE_PROJECT, '-f', COMPOSE_FILE, ...args]);
}

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
