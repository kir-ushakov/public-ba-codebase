#!/usr/bin/env node
/**
 * Shared docker compose helpers for smoke / live e2e.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '../..');
export const COMPOSE_FILE = 'docker-compose.smoke.yml';
export const COMPOSE_PROJECT = 'ba-smoke';
export const CERT_DIR = path.join(__dirname, 'certs');
export const SMOKE_BASE_URL = 'https://127.0.0.1:3443';

export function run(cmd, args, opts = {}) {
  console.log(`[smoke] ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    ...opts,
  });
  return result.status ?? 1;
}

export function ensureCerts() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  const crt = path.join(CERT_DIR, 'server.crt');
  const key = path.join(CERT_DIR, 'server.key');
  if (fs.existsSync(crt) && fs.existsSync(key)) {
    console.log('[smoke] reusing existing smoke TLS certs');
    return;
  }

  console.log('[smoke] generating self-signed TLS certs via openssl container');
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

export function compose(...args) {
  return run('docker', ['compose', '-p', COMPOSE_PROJECT, '-f', COMPOSE_FILE, ...args]);
}
