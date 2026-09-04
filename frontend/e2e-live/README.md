# Live two-client e2e

Playwright drives two isolated browser contexts against the **real** smoke backend (HTTPS + Mongo). The existing `e2e/` suite stays mocked and runs on every PR; this folder is nightly only.

## What it checks

One verified user, two devices (separate Playwright contexts). Create a task in A; B’s home list shows it after the 20s sync interval.

No API mocks. No Google stub. Title-only tasks (live Google Drive is a placeholder and would 502).

## Prerequisites

Docker Desktop (or Engine) must be running so `docker-compose.smoke.yml` can boot.

## Run locally

From the repo root, start the smoke stack and leave it up:

```bash
node scripts/smoke/up.mjs
```

From `frontend/`:

```bash
npm run e2e:live
```

That serves Angular with `proxy.live.conf.json` (`/api` → `https://127.0.0.1:3443`) and runs `e2e-live/two-client-sync.spec.ts`.

Tear down:

```bash
node scripts/smoke/down.mjs
```

Alternatively, API-only smoke (`node scripts/smoke/run.mjs`) with `SMOKE_KEEP_UP=1` also leaves the same compose project (`ba-smoke`) running.

## CI

`.github/workflows/live-e2e.yml` runs on a nightly schedule (`0 4 * * *`) and `workflow_dispatch`. It is not on every PR — the smoke image build is slow, and this spec waits on the 20s client sync tick.
