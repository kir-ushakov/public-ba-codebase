---
name: write-integration-test
description: Workflow for writing a backend integration spec against the real Express app and in-memory MongoDB. Use when adding or updating tests under backend/test, or after implementing a backend use case that needs coverage.
---

# Write a backend integration test

Process only. Testing policy is in `.cursor/rules/testing-backend.mdc` — follow it, do not restate it. The spec to imitate is named in `backend/AGENTS.md`; every helper is mapped in `backend/test/README.md`.

Integration is the default here: the real `createApp()`, real routers, real Passport JWT, real repos, real mappers, real Mongoose, against `mongodb-memory-server`. Only external systems get mocked. Do not unit-test a controller or use case with a mocked repo.

Run from `backend/`. PowerShell — chain with `;`.

## Checklist

```
- [ ] 1. Place and name the spec
- [ ] 2. Copy the lifecycle
- [ ] 3. Authenticate
- [ ] 4. Happy path
- [ ] 5. Validation failure
- [ ] 6. External-service failure
- [ ] 7. Run it, then run it alone
```

## 1. Place and name the spec

`backend/test/integration/<module>/` mirrors `src/modules/<module>/usecases/`. Name the file `<use-case>.int.spec.ts` and describe it after the layers it exercises:

```ts
describe('Integration: CreateTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
```

Imports carry the `.js` extension like the rest of the backend.

## 2. Copy the lifecycle

Do not invent a parallel mini-Express or fake `req.user`. The harness in `test/integration/_setup/` exists for this:

```ts
beforeAll(async () => {
  await startInMemoryMongo();
  app = buildTestApp().app;
}, 30_000);

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  await clearDatabase();
  jest.clearAllMocks();
});
```

The 30-second timeout on `beforeAll` matters: the first run downloads a MongoDB binary.

## 3. Authenticate

`seedTestUser()` creates a real user and returns `{ userId, email, jwtCookie }`. Send requests through `authenticatedRequest(app, jwtCookie)`, which sets the `jwt` cookie on `get` / `post` / `patch` / `delete`.

Everything under `/api/sync` sits behind `isAuthenticated`. For a flow that logs in as part of the test, `jwtCookieFromResponse(res)` extracts the cookie from a login response.

Other helpers in `_setup/`: `sync.helper.ts`, `slack.helper.ts`, `fake-google.strategy.ts`. Read them before writing your own — and read `harness.smoke.spec.ts` for the minimal working example.

## 4. Happy path

Assert observable outcomes, not internals:

1. the HTTP status,
2. the response body, typed against the DTO from `@brainassistant/contracts`,
3. the document read back through the Mongoose model.

The third assertion is the one that makes this an integration test — without it you have only checked the controller's echo.

## 5. Validation failure

Send input the domain rejects and assert the status **and** the body's `name` and `message`. `name` carries the domain error code, and the E2E mocks on the frontend mirror these responses, so getting them exactly right matters beyond this spec.

## 6. External-service failure

Mock only external systems: Slack, Google Drive, OpenAI, email. Google Drive is already stubbed for Jest in `test/__mocks__/google-drive-services.ts` so the ESM `mime` package never loads. Repos, mappers, domain models and the database stay real.

Assert that the use case degrades the way it is designed to — whether the external failure fails the request or is swallowed.

## 7. Run it

```powershell
npm test -- <spec-file>
npm test
```

Run the single spec first, then the whole suite: a spec that passes alone but fails in the suite is leaking state, which usually means a missed `clearDatabase()` or a module-level mock that is not reset.

Specs must be deterministic — no real network, no assertions on the current time or random values, no ordering assumptions. Remove any `console.log` before finishing.
