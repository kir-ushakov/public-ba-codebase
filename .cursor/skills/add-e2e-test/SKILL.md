---
name: add-e2e-test
description: Workflow for writing a Playwright E2E spec against the Angular PWA with a mocked backend. Use when adding or updating specs in frontend/e2e, or after implementing a user-visible flow that needs end-to-end coverage.
---

# Add an E2E test

Process only. Selector, mocking and waiting rules are in `.cursor/rules/testing-e2e.mdc` — follow them, do not restate them.

Specs drive the real UI on the `e2e` build configuration against a fully mocked backend. Run from `frontend/`.

## Checklist

```
- [ ] 1. Read the existing specs
- [ ] 2. Make sure the elements are reachable
- [ ] 3. Extend the central mocks
- [ ] 4. Write the spec
- [ ] 5. Run it
```

## 1. Read the existing specs

`frontend/e2e/create-task.spec.ts` is the fullest flow; `edit-task`, `delete-task` and `sync-error` cover the variants. `frontend/e2e/README.md` describes the setup.

Reuse `e2e/utils/task-flow.util.ts` before writing new navigation: `signIn(page)` and `createTaskWithTitle(page, title)` already handle the sign-in and create flows including their waits. Most specs need a task to exist but are not testing creation.

## 2. Make sure the elements are reachable

Every element the spec touches needs a `data-test` attribute — this project uses `data-test`, not `data-testid`. Missing hooks are added to the template, never worked around with CSS classes or DOM position.

Native capabilities (Google sign-in, camera) are swapped at build time via `fileReplacements` in the `e2e` configuration of `frontend/angular.json`, pointing at `e2e/stubs/`. Covering a new native capability means adding a stub plus a `fileReplacements` entry — do not fake it inside the spec.

Binary fixtures go in `e2e/assets/`.

## 3. Extend the central mocks

HTTP is mocked in one place: `e2e/utils/api-mocks.util.ts`. Call `await setupApiMocks(page)` at the start of the spec and add new routes to that util rather than scattering `page.route` calls.

The mock must mirror the real backend, which the backend integration specs pin: same status codes (`POST /api/sync/task` answers 201, `PATCH` answers 200), same body shape, typed against `@brainassistant/contracts`. A mock that is more forgiving than the real API produces a green suite and a broken app.

For failure paths, add an option to `SetupApiMocksOptions` the way `failTaskSync` does, instead of re-routing inside the spec.

## 4. Write the spec

Assert what the user can observe, plus what the app sent. To capture the request, register `page.waitForResponse(...)` **before** the click that triggers it, then inspect `request().postDataJSON()`.

Rely on auto-waiting: `expect(locator).toBeVisible()` and `page.waitForURL(...)`. Never `page.waitForTimeout()`. Do not reach into NGXS state or component internals — that is what the state specs in `frontend/tests/unit/state/` are for.

Keep specs independent: no shared state, no ordering assumptions.

## 5. Run it

```powershell
npm run e2e
npx playwright test e2e/<spec>.spec.ts
npm run e2e:ui
```

`npm run e2e` starts the `e2e` dev server itself via the Playwright config; there is no need to run `start:e2e` separately.

If a spec is flaky, the cause is almost always a missing wait on navigation or on the response — not a timing problem to be papered over with a timeout.

`npm run e2e:live` runs the separate `e2e-live/` suite against a real backend. That is a different loop; do not put mocked specs there.
