#!/usr/bin/env node
/**
 * Compose smoke: signup → verify in Mongo → login → create task → task in Mongo,
 * then two sync clientIds both see the new task via GetChanges.
 *
 * Expects docker compose smoke stack already up (see run.mjs / README).
 */
import https from 'https';
import { execFileSync } from 'child_process';

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'https://127.0.0.1:3443';
const COMPOSE_FILE = process.env.SMOKE_COMPOSE_FILE ?? 'docker-compose.smoke.yml';
const COMPOSE_PROJECT = process.env.SMOKE_COMPOSE_PROJECT ?? 'ba-smoke';
const EMAIL = `smoke-${Date.now()}@example.com`;
const PASSWORD = 'password123';
const TASK_ID = `smoke-task-${Date.now()}`;
const TASK_TITLE = 'Compose smoke task';

const agent = new https.Agent({ rejectUnauthorized: false });

function log(step, detail = '') {
  console.log(`[smoke] ${step}${detail ? `: ${detail}` : ''}`);
}

function fail(message) {
  console.error(`[smoke] FAIL: ${message}`);
  process.exit(1);
}

async function request(method, path, { body, cookie } = {}) {
  const url = new URL(path, BASE_URL);
  const headers = { Accept: 'application/json' };
  let payload;
  if (body !== undefined) {
    payload = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(payload);
  }
  if (cookie) {
    headers.Cookie = cookie;
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      { method, headers, agent },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json;
          try {
            json = raw ? JSON.parse(raw) : undefined;
          } catch {
            json = undefined;
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: json,
            text: raw,
          });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function jwtCookieFromSetCookie(setCookie) {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const jwt = list.find(c => c.startsWith('jwt='));
  if (!jwt) {
    fail(`No jwt Set-Cookie in: ${JSON.stringify(list)}`);
  }
  return jwt.split(';')[0];
}

function mongosh(evalJs) {
  return execFileSync(
    'docker',
    [
      'compose',
      '-p',
      COMPOSE_PROJECT,
      '-f',
      COMPOSE_FILE,
      'exec',
      '-T',
      'db',
      'mongosh',
      '--quiet',
      '-u',
      'smoke',
      '-p',
      'smoke-password',
      '--authenticationDatabase',
      'admin',
      'ba',
      '--eval',
      evalJs,
    ],
    { encoding: 'utf8' },
  ).trim();
}

async function waitForBackend(timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await request('GET', '/');
      if (res.status === 200) {
        log('backend up', res.body?.message ?? res.text);
        return;
      }
    } catch {
      // still booting
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  fail(`backend not reachable at ${BASE_URL} within ${timeoutMs}ms`);
}

async function main() {
  await waitForBackend();

  log('signup', EMAIL);
  const signup = await request('POST', '/api/auth/signup', {
    body: {
      email: EMAIL,
      firstName: 'Smoke',
      lastName: 'User',
      password: PASSWORD,
    },
  });
  if (signup.status !== 200 && signup.status !== 201) {
    fail(`signup ${signup.status} ${signup.text}`);
  }

  log('mark user verified in Mongo');
  mongosh(
    `db.users.updateOne({ username: '${EMAIL}' }, { $set: { verified: true } })`,
  );

  log('login');
  const login = await request('POST', '/api/auth/login', {
    body: { username: EMAIL, password: PASSWORD },
  });
  if (login.status !== 200) {
    fail(`login ${login.status} ${login.text}`);
  }
  const jwtCookie = jwtCookieFromSetCookie(login.headers['set-cookie']);
  const userId = login.body?.user?.userId;
  if (!userId) {
    fail(`login response missing userId: ${login.text}`);
  }

  log('allocate two sync clientIds');
  const clientARes = await request('GET', '/api/sync/release-client-id', {
    cookie: jwtCookie,
  });
  const clientBRes = await request('GET', '/api/sync/release-client-id', {
    cookie: jwtCookie,
  });
  if (clientARes.status !== 200 || clientBRes.status !== 200) {
    fail(`release-client-id failed: ${clientARes.status}/${clientBRes.status}`);
  }
  const clientA = clientARes.body.clientId;
  const clientB = clientBRes.body.clientId;

  log('create task', TASK_ID);
  const create = await request('POST', '/api/sync/task', {
    cookie: jwtCookie,
    body: {
      changeableObjectDto: {
        id: TASK_ID,
        type: 'TASK',
        title: TASK_TITLE,
        status: 'OPEN',
      },
    },
  });
  if (create.status !== 201) {
    fail(`create task ${create.status} ${create.text}`);
  }
  if (create.body?.userId !== userId) {
    fail(`task userId mismatch: ${JSON.stringify(create.body)}`);
  }

  log('assert task document in Mongo');
  const taskCount = mongosh(`db.tasks.countDocuments({ _id: '${TASK_ID}' })`);
  if (taskCount !== '1') {
    fail(`expected 1 task in Mongo, got ${taskCount}`);
  }

  const changesA = await request(
    'GET',
    `/api/sync/changes?clientId=${encodeURIComponent(clientA)}`,
    { cookie: jwtCookie },
  );
  const changesB = await request(
    'GET',
    `/api/sync/changes?clientId=${encodeURIComponent(clientB)}`,
    { cookie: jwtCookie },
  );
  if (changesA.status !== 200 || changesB.status !== 200) {
    fail(`get-changes failed: ${changesA.status}/${changesB.status}`);
  }

  const aHasTask = (changesA.body?.changes ?? []).some(
    c => c?.object?.id === TASK_ID || c?.object?.title === TASK_TITLE,
  );
  const bHasTask = (changesB.body?.changes ?? []).some(
    c => c?.object?.id === TASK_ID || c?.object?.title === TASK_TITLE,
  );
  if (!aHasTask || !bHasTask) {
    fail(
      `both clients should see the task; A=${JSON.stringify(changesA.body)} B=${JSON.stringify(changesB.body)}`,
    );
  }

  log('OK', 'signup → task in Mongo → two clientIds see GetChanges');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
