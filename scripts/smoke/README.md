# Compose smoke

API-level smoke against a real Docker stack (`db` + HTTPS `backend`). No frontend, no nginx, no real Slack/Drive/OpenAI.

## What it checks

1. `POST /api/auth/signup`
2. Mark user `verified` in Mongo (email sending is unused in production)
3. `POST /api/auth/login` → JWT cookie
4. `POST /api/sync/task` → document in `tasks`
5. Two `clientId`s both receive the task via `GET /api/sync/changes`

## Run locally

Docker Desktop (or Engine) must be running.

```bash
node scripts/smoke/run.mjs
```

Leave the stack up after a pass:

```bash
# PowerShell
$env:SMOKE_KEEP_UP='1'; node scripts/smoke/run.mjs
```

Re-run only the HTTP checks against an already-up stack:

```bash
node scripts/smoke/http-smoke.mjs
```

## CI

`.github/workflows/compose-smoke.yml` runs on a nightly schedule and `workflow_dispatch`. It is intentionally not on every PR — image builds are slow.

## Notes

- Self-signed certs are generated into `scripts/smoke/certs/` (gitignored) via an `alpine/openssl` container.
Images are cached after the first run. A leftover `db` on host port 27017 is ignored: smoke Mongo is not published to the host.
