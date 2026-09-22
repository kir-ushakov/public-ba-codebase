---
name: add-integration-test
description: Workflow for writing a Playwright integration spec against the Angular PWA with a mocked backend. Use when adding or updating specs in frontend/tests/integration, or after implementing a user-visible flow that needs browser coverage.
---

# Add a frontend integration test

Process only. Selector, mocking and waiting rules are in `.cursor/rules/testing-frontend-integration.mdc` — follow them, do not restate them.

Specs drive the real UI on the `integration` build configuration against a fully mocked backend. Run from `frontend/`.

## Checklist

```
- [ ] 1. Read the existing specs
- [ ] 2. Make sure the elements are reachable
- [ ] 3. Extend the central mocks
- [ ] 4. Write the spec
- [ ] 5. Run it
```

## 1. Read the existing specs

`frontend/AGENTS.md` names the spec to imitate and what to take from it; `frontend/tests/integration/README.md` describes the setup and what each existing spec covers.

Reuse `tests/integration/utils/task-flow.util.ts` before writing new navigation: `signIn(page)` and `createTaskWithTitle(page, title)` already handle the sign-in and create flows including their waits. Most specs need a task to exist but are not testing creation.

## 2. Make sure the elements are reachable

Every element the spec touches needs a `data-test` attribute — this project uses `data-test`, not `data-testid`. Missing hooks are added to the template, never worked around with CSS classes or DOM position.

Native capabilities (Google sign-in, camera) are swapped at build time via `fileReplacements` in the `integration` configuration of `frontend/angular.json`, pointing at `tests/integration/stubs/`. Covering a new native capability means adding a stub plus a `fileReplacements` entry — do not fake it inside the spec.

Binary fixtures go in `tests/integration/assets/`.

## 3. Extend the central mocks

HTTP is mocked in one place: `tests/integration/utils/api-mocks.util.ts`. Call `await setupApiMocks(page)` at the start of the spec and add new routes to that util rather than scattering `page.route` calls.

The mock must mirror the real backend, which the backend integration specs pin: same status codes (`POST /api/sync/task` answers 201, `PATCH` answers 200), same body shape, typed against `@brainassistant/contracts`. A mock that is more forgiving than the real API produces a green suite and a broken app.

For failure paths, add an option to `SetupApiMocksOptions` the way `failTaskSync` does, instead of re-routing inside the spec.

## 4. Write the spec

Assert what the user can observe, plus what the app sent. To capture the request, register `page.waitForResponse(...)` **before** the click that triggers it, then inspect `request().postDataJSON()`.

Rely on auto-waiting: `expect(locator).toBeVisible()` and `page.waitForURL(...)`. Never `page.waitForTimeout()`. Do not reach into NGXS state or component internals — that is what the state specs in `frontend/tests/unit/state/` are for.

Keep specs independent: no shared state, no ordering assumptions.

## 5. Run it

```powershell
npm run integration
npx playwright test tests/integration/<spec>.spec.ts
npm run integration:ui
```

`npm run integration` starts the `integration` dev server itself via the Playwright config; there is no need to run `start:integration` separately.

If a spec is flaky, the cause is almost always a missing wait on navigation or on the response — not a timing problem to be papered over with a timeout.

`npm run e2e` runs the separate `tests/e2e/` suite against a real backend. That is a different loop; do not put mocked specs there.
