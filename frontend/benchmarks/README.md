# Performance benchmark

Reproducible measurements after the IndexedDB move. The harness does not change how tasks are stored, synced, or drawn. Dev and production builds keep the hooks in `src/app/benchmark/` as empty functions. Only `ng build --configuration benchmark` swaps in the real marks and the `window.__BA_BENCH__` probe.

The probe writes one IndexedDB database, `ba-bench-user`. It does not delete other databases. Serve it from a private origin (this script uses `http://127.0.0.1:4300` unless you override it). Do not point it at the production host.

`fake-indexeddb` is for Jest. It is not used here. Timings come from Chromium's IndexedDB, and a write is timed until the transaction completes.

## Dataset

`dataset.mjs` is deterministic. Seed `20261031`. The same count and seed produce the same tasks.

| Status | Share of the set |
|---|---:|
| To do | 50% |
| Active | 20% |
| Done | 25% |
| Cancelled | the rest |

1000 tasks is 500 / 200 / 250 / 50. Control sets are 100 and 5000. The report uses 1000.

Adaptations, because the product model does not have a separate "rich text" column and Home has no Done/Cancelled mode:

- Identifiers are `task-00001`, not uuids.
- 20 tags, color `#00a991` (the color the app assigns to a new tag).
- 60% of tasks get 1–4 tags. 40% have none.
- Task type is 80% To do (`TASK_TYPE_BASIC`), 10% Calendar, 10% Location.
- Every task has a description document: 30% are 40–80 characters, 50% are 500–2000, 20% are 5000–10000, split into paragraphs of 500 characters.
- 10% store `imageId` / `images` only. No image blobs are written.
- There is no Notes status in this set, so the Notes tab is empty. Done and Cancelled stay in the database and do not appear as Home modes.
- Home renders every tile of the current mode. It does not virtualize. The To do mode of the 1000-task set is 500 tiles, not 1000.

`jsonBytes` in the result file is the UTF-8 size of `JSON.stringify({ tasks, tags })`.

## Desktop

From `frontend/`:

```powershell
npx ng build --configuration benchmark
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:USERPROFILE\AppData\Local\ms-playwright"
node benchmarks/run.mjs
```

The script serves `dist/app/browser` on `127.0.0.1:4300`, opens Chromium at 375×667, seeds the database, then measures. Output: `benchmarks/results/desktop-chrome.json`.

What it repeats:

| Scenario | Repetitions | Warmup |
|---|---:|---|
| Cold start, warm HTTP cache | 10 reloads | none (first reload is stored separately) |
| Cold HTTP cache (`Network.setCacheDisabled`) | 10 reloads | one unmeasured reload after seeding |
| IndexedDB read, save, update, delete, batch of 100, selectors | 31 | first sample dropped |
| Filter switch | 30 clicks | none |
| Open task and return | 10 | none |
| Typing | 80 characters, 16 ms apart | none |
| Task update for the memory step | 100 | none |

Network calls to `/api/**` are mocked. Sync and token refresh cannot wander. Google font CSS is an empty response.

Cold start does not include generating or seeding. Seeding finishes before the first measured reload.

Selector times:

- `cachedAllTasksMs` is `selectSnapshot(allTasks)` with no state change. That is the memoized read, not the compute.
- `resetMs` is `store.reset` of the same snapshot with one title changed.
- `allTasksMs` is the `selectSnapshot(allTasks)` after that reset.
- `actualTasks` is its own selector. It sorts the list again; it does not reuse `allTasks`.
- Status filter calls `tasksForHomeMode`.
- Tag filter calls `filterHomeTasks` with the query `tag 01`. That function scans title, description text, and tag names. It is the Home search, not a tag-id index.
- Sort is a separate copy of the snapshot sorted by `createdAt`.

Scroll is a programmatic `scrollTop` stepped across 40 animation frames. It is not a finger or a mouse wheel. Filter clicks, tile taps, typing, Save, and Done are Playwright input.

`performance.memory` is not read. Heap numbers are `JSHeapUsedSize` from the Chrome DevTools protocol, then again after `HeapProfiler.collectGarbage`. That is the page process, not Android PSS. A larger heap is not by itself a leak.

CPU throttling is not applied.

## Android

This session did not measure a phone. Do not copy `desktop-chrome.json` into an Android column.

When a mid-range phone (about 6–8 GB RAM) is on USB debugging:

1. Build the same configuration: `npx ng build --configuration benchmark`.
2. Forward Chrome's DevTools socket:

```powershell
adb forward tcp:9222 localabstract:chrome_devtools_remote
```

3. On the phone, open one Chrome tab. Do not use the installed PWA for this run unless you mean to measure the installed PWA; write which one it was in the report.
4. From `frontend/`, point the same script at that Chrome and at a URL the phone can open. `BENCH_HOST=0.0.0.0` makes the static server reachable on the LAN. `BENCH_PUBLIC_ORIGIN` must be the URL the phone loads, with a trailing slash.

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:USERPROFILE\AppData\Local\ms-playwright"
$env:BENCH_CDP = "http://127.0.0.1:9222"
$env:BENCH_HOST = "0.0.0.0"
$env:BENCH_PUBLIC_ORIGIN = "http://192.168.1.10:4300/"
node benchmarks/run.mjs
```

Replace `192.168.1.10` with this computer's LAN address. The phone and the computer stay on the same network. The script writes `benchmarks/results/android-chrome.json` and does not overwrite the desktop file.

That path was not executed here. Confirm the phone model, Android version, Chrome version, RAM, and whether the page was a browser tab or an installed PWA before quoting the file.

The origin in `BENCH_PUBLIC_ORIGIN` is not the production site, so the phone's real account data on the production origin is left alone. The script still replaces the `user` localStorage key on the origin it opens, and it writes `ba-bench-user` only.

Chrome DevTools CPU throttling stays a preview. Do not put throttled numbers in the Android report.

## What a result file means

`results/*.json` is written only by a run that finished. `commit.sha` is `git rev-parse HEAD` at run time. `commit.dirty` is true when the working tree had extra edits, so the SHA does not contain this harness until those edits are committed.

For 10 cold-start samples, nearest-rank p95 is the slowest sample. Say that next to the table. For 30 samples, p95 is the 29th.

The service worker is registered because the benchmark environment is a production build (`registerWhenStable:30000`). The JSON records `serviceWorkerControlled` and how many resources reported `transferSize === 0`. A zero transfer size can be the memory cache or the service worker, not only a warm HTTP disk cache.

## Not in the normal bundle

`src/app/benchmark/bench-marks.ts` and `install-benchmark-probe.ts` are no-ops. `angular.json` configuration `benchmark` file-replaces them, and replaces `environment.ts` with `environment.benchmark.ts` (`production: true`). `ng build` and `ng build --configuration production` do not include the probe.
