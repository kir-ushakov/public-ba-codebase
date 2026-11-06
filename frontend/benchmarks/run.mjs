/**
 * Desktop Chromium benchmark against the production benchmark build.
 * Does not measure a physical Android phone. See README.md.
 *
 * From frontend/, after `npx ng build --configuration benchmark`:
 *   node benchmarks/run.mjs
 *
 * A phone is not launched from here. Set BENCH_CDP and BENCH_PUBLIC_ORIGIN
 * only when Chrome on that phone is already reachable. See README.md.
 */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { BENCH_SEED, BENCH_USER_ID, generateDataset } from './dataset.mjs';
import { summarize } from './stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, '..');
const distDir = path.join(frontendRoot, 'dist', 'app', 'browser');
const resultsDir = path.join(here, 'results');
const port = Number(process.env.BENCH_PORT ?? 4300);
const listenHost = process.env.BENCH_HOST ?? '127.0.0.1';
const attached = Boolean(process.env.BENCH_CDP);

const userState = {
  userData: {
    firstName: 'Bench',
    lastName: 'User',
    email: 'bench@example.com',
    userId: BENCH_USER_ID,
    googleId: 'bench-google',
  },
  authState: 'USER_AUTH_STATE_AUTHENTICATED',
  authType: 'USER_AUTH_TYPE_GOOGLE',
  integrations: { isAddedToSlack: false },
};

const primary = generateDataset(1000, BENCH_SEED);
const primaryAgain = generateDataset(1000, BENCH_SEED);
if (primary.jsonBytes !== primaryAgain.jsonBytes || primary.tasks[10].title !== primaryAgain.tasks[10].title) {
  throw new Error('Dataset generator is not deterministic');
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  throw new Error(`Missing ${distDir}. Run: npx ng build --configuration benchmark`);
}

const server = await listen(distDir, port, listenHost);
const browser = attached ? await chromium.connectOverCDP(process.env.BENCH_CDP) : await chromium.launch();
const startedAt = new Date().toISOString();
try {
  const context = await newContext(browser);
  const page = await context.newPage();
  await mockNetwork(page);
  await page.goto(server.origin, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__BA_BENCH__);

  const scale = {};
  for (const count of [100, 1000, 5000]) {
    const dataset = count === 1000 ? primary : generateDataset(count, BENCH_SEED);
    await writeSeed(page, dataset);
    scale[count] = { jsonBytes: dataset.jsonBytes, counts: dataset.counts, micro: await micro(page, dataset) };
  }

  await writeSeed(page, primary);
  const coldApp = [];
  for (let run = 0; run < 10; run += 1) {
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(
      () => performance.getEntriesByName('ba:list-painted').length > 0,
      null,
      { timeout: 30_000 },
    );
    coldApp.push(await collectStartup(page));
  }

  const coldCacheContext = await newContext(browser);
  const coldCachePage = await coldCacheContext.newPage();
  await mockNetwork(coldCachePage);
  const client = await coldCacheContext.newCDPSession(coldCachePage);
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await coldCachePage.goto(server.origin, { waitUntil: 'load' });
  await coldCachePage.waitForFunction(() => window.__BA_BENCH__);
  await writeSeed(coldCachePage, primary);
  await coldCachePage.reload({ waitUntil: 'load' });
  await coldCachePage.waitForFunction(
    () => performance.getEntriesByName('ba:list-painted').length > 0,
  );
  const coldHttpCache = [];
  for (let run = 0; run < 10; run += 1) {
    await coldCachePage.reload({ waitUntil: 'load' });
    await coldCachePage.waitForFunction(
      () => performance.getEntriesByName('ba:list-painted').length > 0,
      null,
      { timeout: 30_000 },
    );
    coldHttpCache.push(await collectStartup(coldCachePage));
  }
  if (!attached) {
    await coldCacheContext.close();
  }

  await page.bringToFront();
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => performance.getEntriesByName('ba:list-painted').length > 0);
  const memory = { afterHydration: await heap(page) };
  const ui = await userInterface(page);
  memory.afterOpenClose = await heap(page);
  const updateTask = primary.tasks[0];
  const updates = [];
  for (let index = 0; index < 100; index += 1) {
    updates.push(
      await page.evaluate(
        async task => window.__BA_BENCH__.saveTask(task),
        { ...updateTask, title: `Task 1 edit ${index}` },
      ),
    );
  }
  memory.afterHundredUpdates = await heap(page);
  await page.goto(`${server.origin}home`, { waitUntil: 'load' });
  await page.waitForFunction(() => performance.getEntriesByName('ba:list-painted').length > 0);
  memory.afterReturnHome = await heap(page);
  memory.afterGc = await heapAfterGc(page);

  const result = {
    measuredAt: startedAt,
    commit: commitInfo(),
      environment: {
        kind: attached ? 'android-cdp' : 'desktop-chromium',
        android: null,
        note: attached
          ? 'Chrome attached with BENCH_CDP. Fill the phone model, Android version and RAM in the report by hand. This file is not a desktop run.'
          : 'Not a physical phone. Viewport is phone-sized; CPU and RAM are this computer.',
        chrome: browser.version(),
        viewport: { width: 375, height: 667 },
        platform: process.platform,
        osRelease: os.release(),
        cpu: os.cpus()[0]?.model ?? null,
        logicalCores: os.cpus().length,
        totalMemoryBytes: os.totalmem(),
        node: process.version,
        build: 'ng build --configuration benchmark (production optimization, service worker on)',
        seed: BENCH_SEED,
        userId: BENCH_USER_ID,
        database: `ba-${BENCH_USER_ID}`,
      },
    dataset: {
      primaryCount: 1000,
      jsonBytes: primary.jsonBytes,
      counts: primary.counts,
      adaptations: [
        'Ids are task-00001, not uuid.',
        '60% of tasks have 1–4 tags; 40% have none.',
        'Types are 80% To do (TASK_TYPE_BASIC), 10% Calendar, 10% Location.',
        'Home has no Notes status in this set, so the Notes tab is empty.',
        'Done and Cancelled stay in IndexedDB but are not a Home mode.',
        '10% carry imageId metadata only. No image blobs are stored.',
        'Tag color is #00a991, the same constant the app uses for new tags.',
      ],
    },
    bench01ColdStart: {
      coldAppWarmHttpCache: splitFirst(coldApp),
      coldHttpCache: splitFirst(coldHttpCache),
      runs: coldApp,
      coldHttpCacheRuns: coldHttpCache,
    },
    bench02And03: scale,
    bench04And05: ui,
    bench06Memory: {
      unit: 'JSHeapUsedSize bytes from Chrome DevTools Protocol Performance.getMetrics',
      limitation:
        'This is Chrome-only heap inside the page process, not Android PSS and not performance.memory. A larger heap after work is not by itself a leak. afterGc is measured after HeapProfiler.collectGarbage.',
      ...memory,
      hundredUpdates: summarize(updates),
    },
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  const out = path.join(resultsDir, attached ? 'android-chrome.json' : 'desktop-chrome.json');
  fs.writeFileSync(out, JSON.stringify(result, null, 2));
  console.log(`Wrote ${out}`);
  console.log(
    JSON.stringify(
      {
        jsonBytes: primary.jsonBytes,
        coldListP50: result.bench01ColdStart.coldAppWarmHttpCache.rest.startupToListMs.p50,
        readP50: scale[1000].micro.read.p50,
        writeP50: scale[1000].micro.save.p50,
        selectorP50: scale[1000].micro.selectors.allTasksMs.p50,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await server.close();
}

function commitInfo() {
  return {
    sha: readGitHead(path.resolve(frontendRoot, '..')),
    dirty: null,
  };
}

function readGitHead(repoRoot) {
  try {
    let gitDir = path.join(repoRoot, '.git');
    if (fs.statSync(gitDir).isFile()) {
      const pointer = fs.readFileSync(gitDir, 'utf8').trim();
      const match = pointer.match(/^gitdir:\s*(.+)$/);
      if (!match) {
        return null;
      }
      gitDir = path.resolve(repoRoot, match[1]);
    }
    const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    if (!head.startsWith('ref: ')) {
      return head;
    }
    const refPath = path.join(gitDir, head.slice('ref: '.length));
    if (fs.existsSync(refPath)) {
      return fs.readFileSync(refPath, 'utf8').trim();
    }
    return readPackedRef(gitDir, head.slice('ref: '.length));
  } catch {
    return null;
  }
}

function readPackedRef(gitDir, refName) {
  const packedPath = path.join(gitDir, 'packed-refs');
  if (!fs.existsSync(packedPath)) {
    return null;
  }
  for (const line of fs.readFileSync(packedPath, 'utf8').split('\n')) {
    if (line.startsWith('#') || line.startsWith('^')) {
      continue;
    }
    const [sha, ref] = line.split(' ');
    if (ref === refName) {
      return sha;
    }
  }
  return null;
}

async function newContext(browser) {
  const context = attached
    ? browser.contexts()[0]
    : await browser.newContext({ viewport: { width: 375, height: 667 } });
  if (!context) {
    throw new Error('BENCH_CDP is set, but Chrome has no window. Open one tab, then rerun.');
  }
  await context.addInitScript(state => {
    localStorage.setItem('user', JSON.stringify(state));
    window.__BENCH_LONG_TASKS = [];
    window.__BENCH_EVENTS = [];
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.__BENCH_LONG_TASKS.push(entry.duration);
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch {
      // Older browsers omit longtask.
    }
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.__BENCH_EVENTS.push({ name: entry.name, duration: entry.duration });
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch {
      // Event Timing is missing.
    }
  }, userState);
  return context;
}

async function mockNetwork(page) {
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return;
    }
    if (!url.includes('/api/')) {
      await route.continue();
      return;
    }
    if (url.includes('/api/sync/changes')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ changes: [], syncRevision: 0 }),
      });
      return;
    }
    if (url.includes('/api/auth/refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ refreshed: true }),
      });
      return;
    }
    if (url.includes('/api/files/image') && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

async function writeSeed(page, dataset) {
  await page.evaluate(async payload => {
    await window.__BA_BENCH__.writeSeed({
      tasks: payload.tasks,
      tags: payload.tags,
      syncedRevision: 1,
    });
  }, { tasks: dataset.tasks, tags: dataset.tags });
}

async function micro(page, dataset) {
  const read = [];
  const save = [];
  const update = [];
  const remove = [];
  const batch = [];
  const selectors = [];
  const sampleTask = dataset.tasks[0];

  for (let index = 0; index < 31; index += 1) {
    read.push(await page.evaluate(() => window.__BA_BENCH__.loadAll()));
    save.push(
      await page.evaluate(async task => window.__BA_BENCH__.saveTask(task), {
        ...sampleTask,
        id: `bench-save-${index}`,
        title: `Saved ${index}`,
      }),
    );
    update.push(
      await page.evaluate(async task => window.__BA_BENCH__.saveTask(task), {
        ...sampleTask,
        title: `Updated ${index}`,
      }),
    );
    const disposable = {
      ...sampleTask,
      id: `bench-delete-${index}`,
      title: `Delete ${index}`,
    };
    await page.evaluate(async task => window.__BA_BENCH__.saveTask(task), disposable);
    remove.push(await page.evaluate(async task => window.__BA_BENCH__.deleteTask(task), disposable));
    batch.push(await page.evaluate(async revision => window.__BA_BENCH__.applyBatch(revision), 10_000 + index));
    selectors.push(await page.evaluate(() => window.__BA_BENCH__.timeSelectors()));
  }

  const warmed = list => ({ first: list[0], ...summarize(list.slice(1)) });
  return {
    read: warmed(read),
    save: warmed(save),
    update: warmed(update),
    delete: warmed(remove),
    applyBatch: warmed(batch),
    selectors: {
      cachedAllTasksMs: warmed(selectors.map(item => item.cachedAllTasksMs)),
      resetMs: warmed(selectors.map(item => item.resetMs)),
      allTasksMs: warmed(selectors.map(item => item.allTasksMs)),
      actualTasksMs: warmed(selectors.map(item => item.actualTasksMs)),
      statusFilterMs: warmed(selectors.map(item => item.statusFilterMs)),
      tagFilterMs: warmed(selectors.map(item => item.tagFilterMs)),
      sortMs: warmed(selectors.map(item => item.sortMs)),
      allCount: selectors[1].allCount,
      actualCount: selectors[1].actualCount,
      todoCount: selectors[1].todoCount,
    },
  };
}

async function collectStartup(page) {
  return page.evaluate(() => {
    const measure = name => {
      const entries = performance.getEntriesByName(name);
      return entries.length === 0 ? null : entries[entries.length - 1].duration;
    };
    const list = performance.getEntriesByName('ba:list-painted');
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const cached = resources.filter(entry => entry.transferSize === 0).length;
    return {
      startupToListMs: list.length === 0 ? null : list[list.length - 1].startTime,
      idbOpenMs: measure('ba:idb-open'),
      idbReadMs: measure('ba:idb-read'),
      ngxsHydrateMs: measure('ba:ngxs-hydrate'),
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : null,
      loadEventMs: navigation ? navigation.loadEventEnd : null,
      resourceCount: resources.length,
      cachedResourceCount: cached,
      longTasks: [...(window.__BENCH_LONG_TASKS ?? [])],
      serviceWorkerControlled: Boolean(navigator.serviceWorker && navigator.serviceWorker.controller),
    };
  });
}

function splitFirst(runs) {
  return {
    first: runs[0],
    rest: startupSummary(runs.slice(1)),
    all: startupSummary(runs),
  };
}

function startupSummary(runs) {
  const pick = key => summarize(runs.map(run => run[key]).filter(value => typeof value === 'number'));
  return {
    startupToListMs: pick('startupToListMs'),
    idbOpenMs: pick('idbOpenMs'),
    idbReadMs: pick('idbReadMs'),
    ngxsHydrateMs: pick('ngxsHydrateMs'),
    domContentLoadedMs: pick('domContentLoadedMs'),
    loadEventMs: pick('loadEventMs'),
    longTaskCount: summarize(runs.map(run => run.longTasks.length)),
    longTaskMaxMs: summarize(runs.map(run => run.longTasks.reduce((max, value) => Math.max(max, value), 0))),
    serviceWorkerControlled: runs.map(run => run.serviceWorkerControlled),
    cachedResourceCount: runs.map(run => run.cachedResourceCount),
  };
}

async function userInterface(page) {
  await page.click('[data-test="home-mode-todo"]');
  await page.waitForFunction(
    () => document.querySelectorAll('[data-test="task-tile"]').length > 100,
  );
  const dom = await page.evaluate(() => ({
    tiles: document.querySelectorAll('[data-test="task-tile"]').length,
    allElements: document.querySelectorAll('*').length,
  }));

  const filterSwitches = [];
  for (let index = 0; index < 30; index += 1) {
    const target = index % 2 === 0 ? 'active' : 'todo';
    const started = Date.now();
    await page.click(`[data-test="home-mode-${target}"]`);
    await page.waitForFunction(
      mode => document.querySelector(`[data-test="home-mode-${mode}"]`)?.getAttribute('aria-selected') === 'true',
      target,
    );
    const tiles = await page.locator('[data-test="task-tile"]').count();
    filterSwitches.push({ mode: target, ms: Date.now() - started, tiles });
  }

  await page.click('[data-test="home-mode-todo"]');
  const scroll = await page.evaluate(async () => {
    const scroller = document.scrollingElement;
    if (!scroller) {
      return [];
    }
    const deltas = [];
    let last = performance.now();
    const steps = 40;
    for (let step = 1; step <= steps; step += 1) {
      scroller.scrollTop = (scroller.scrollHeight * step) / steps;
      await new Promise(resolve => requestAnimationFrame(resolve));
      const now = performance.now();
      deltas.push(now - last);
      last = now;
    }
    return deltas;
  });

  const opens = [];
  for (let index = 0; index < 20; index += 1) {
    const started = Date.now();
    await page.locator('[data-test="task-tile"]').nth(index).click();
    await page.waitForSelector('[data-test="task-title"]');
    opens.push(Date.now() - started);
    await page.click('[data-test="task-back"]');
    await page.waitForSelector('[data-test="task-tile"]');
  }

  await page.locator('[data-test="task-tile"]').first().click();
  await page.waitForSelector('[data-test="task-title"]');
  await page.click('[data-test="task-options-btn"]');
  await page.click('[data-test="task-menu-edit"]');
  await page.waitForSelector('[data-test="task-title-input"]');
  const beforeEvents = await page.evaluate(() => (window.__BENCH_EVENTS ?? []).length);
  await page.fill('[data-test="task-title-input"]', '');
  await page.locator('[data-test="task-title-input"]').pressSequentially('x'.repeat(80), { delay: 16 });
  const typingEvents = await page.evaluate(start => (window.__BENCH_EVENTS ?? []).slice(start), beforeEvents);
  const saveStarted = Date.now();
  await page.click('[data-test="apply-changes-btn"]');
  await page.waitForURL(/\/home$/);
  const saveMs = Date.now() - saveStarted;

  await page.click('[data-test="home-mode-todo"]');
  await page.locator('[data-test="task-tile"]').nth(5).click();
  await page.waitForSelector('[data-test="mark-task-done-btn"]');
  const statusStarted = Date.now();
  await page.click('[data-test="mark-task-done-btn"]');
  await page.waitForURL(/\/home$/);
  const statusMs = Date.now() - statusStarted;

  const longTasks = await page.evaluate(() => [...(window.__BENCH_LONG_TASKS ?? [])]);
  return {
    dom,
    filterSwitchMs: summarize(filterSwitches.map(sample => sample.ms)),
    filterSwitchSamples: filterSwitches,
    scrollFrameMs: summarize(scroll),
    scrollFramesOver32Ms: scroll.filter(delta => delta > 32).length,
    openTaskMs: summarize(opens),
    typingEventMs: typingEvents.length === 0 ? null : summarize(typingEvents.map(event => event.duration)),
    typingEventCount: typingEvents.length,
    saveAndReturnMs: saveMs,
    markDoneMs: statusMs,
    longTasks: longTasks.length === 0 ? null : summarize(longTasks),
    longTaskCount: longTasks.length,
  };
}

async function heap(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  const { metrics } = await session.send('Performance.getMetrics');
  await session.detach();
  return metrics.find(metric => metric.name === 'JSHeapUsedSize')?.value ?? null;
}

async function heapAfterGc(page) {
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('HeapProfiler.enable');
    await session.send('HeapProfiler.collectGarbage');
  } catch {
    return null;
  } finally {
    await session.detach();
  }
  return heap(page);
}

function listen(root, listenPort, host) {
  const files = listDistFiles(root);
  const indexPath = files.get('/index.html');
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${listenPort}`);
    const filePath = files.get(requestPath(url.pathname)) ?? indexPath;
    if (!filePath) {
      res.writeHead(404);
      res.end();
      return;
    }
    const body = fs.readFileSync(filePath);
    res.writeHead(200, { 'content-type': contentType(filePath) });
    res.end(body);
  });
  return new Promise((resolve, reject) => {
    server.listen(listenPort, host, () => {
      resolve({
        origin: process.env.BENCH_PUBLIC_ORIGIN ?? `http://127.0.0.1:${listenPort}/`,
        close: () => closeServer(server),
      });
    });
    server.on('error', reject);
  });
}

function listDistFiles(root) {
  const files = new Map();
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = `/${path.relative(root, full).split(path.sep).join('/')}`;
      files.set(rel, full);
    }
  };
  walk(root);
  return files;
}

function requestPath(pathname) {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.length > 1 && decoded.endsWith('/') ? decoded.slice(0, -1) : decoded;
  } catch {
    return '/';
  }
}

function contentType(filePath) {
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
  };
  return types[path.extname(filePath)] ?? 'application/octet-stream';
}

function closeServer(server) {
  return new Promise((done, fail) => {
    server.close(error => (error ? fail(error) : done()));
  });
}
