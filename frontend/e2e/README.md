# Frontend E2E tests (mocked API)

Playwright drives the real UI against a **mocked** backend. Specs live in this folder and run on every PR (`npm run e2e` from `frontend/`).

Live two-client tests against a real backend are **not** here — see `frontend/e2e-live/`.

## Layout

```
e2e/
├── assets/
│   └── test-img.jpg
├── stubs/
│   ├── sign-in-with-google-btn.component.ts
│   └── device-camera.service.ts
├── utils/
│   ├── api-mocks.util.ts
│   └── task-flow.util.ts
├── create-task.spec.ts
├── edit-task.spec.ts
├── delete-task.spec.ts
└── sync-error.spec.ts
```

Auth and the device camera are swapped at build time via `fileReplacements` in the `e2e` configuration of `angular.json`. HTTP is mocked in `utils/api-mocks.util.ts` — call `setupApiMocks(page)` at the start of a spec; do not scatter `page.route` calls.

## Selectors

Target elements with `[data-test="..."]`. This project uses `data-test`, not `data-testid`. If a control has no hook, add a `data-test` attribute to the template.

```ts
await page.click('[data-test="new-task-btn"]');
```

Text and role selectors are fine for user-visible copy, e.g. `page.getByText('Sign in with Google')`.

## Run

From `frontend/`:

```bash
npm run e2e
```

That starts `npm run start:e2e` (see `playwright.config.js`) and runs the specs in this folder.

## What the specs cover

- **create-task** — Google stub login, title + image, POST `/api/sync/task`
- **edit-task** — change title, PATCH `/api/sync/task`
- **delete-task** — DELETE `/api/sync/task`
- **sync-error** — POST fails with 500; the task stays on home (offline queue)

Assert what the user can see and the outgoing request payload (`waitForResponse` then `request().postDataJSON()`). Do not reach into NGXS or component internals. Do not use `page.waitForTimeout()`.
