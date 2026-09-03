# Backend tests

Integration is the default: a real Express app (`createApp()`), real controllers / use-cases / repos / Mongoose models, in-memory MongoDB. External APIs (Google Drive, Slack, OpenAI, email) are mocked. Unit tests exist only for pure domain and mappers — not for use-cases or controllers with mocked repos.

## Layout

```
test/
├── setup-env.ts                         # JWT, upload path, dummy third-party keys
├── __mocks__/
│   └── google-drive-services.ts         # Stops Jest loading ESM `mime`
├── unit/
│   ├── core/guard.spec.ts
│   ├── domain/task.spec.ts
│   ├── domain/user-email.spec.ts
│   └── mappers/task.mapper.spec.ts
└── integration/
    ├── _setup/
    │   ├── mongo-memory.ts
    │   ├── build-test-app.ts            # production createApp(), no Mongo bootstrap
    │   ├── auth.helper.ts               # seedTestUser + authenticatedRequest
    │   └── harness.smoke.spec.ts
    ├── _fixtures/
    │   └── test-img.jpg
    ├── files/
    │   └── upload-image.int.spec.ts     # POST /api/files/image
    └── sync/
        └── task-create.int.spec.ts      # POST /api/sync/task
```

Specs are named `<use-case>.int.spec.ts` and described as `Integration: CreateTask (Controller -> UseCase -> Repo -> MongoDB)`. Folders under `integration/` follow `src/modules/<module>/usecases/`. Imports use the `.js` extension, same as production ESM.

## Running tests

From `backend/`:

```bash
npm test
npm run test:watch
npm run test:coverage
npm test -- upload-image.int.spec.ts
```

`createApp()` leaves open handles, so Jest is configured with `forceExit`. Locally you can also pass `--forceExit` on the CLI.

## Integration harness

`buildTestApp()` calls production `createApp()` (real routers, Passport JWT, multer). Do not stand up a parallel mini-Express or fake `req.user`.

1. `startInMemoryMongo()` in `beforeAll`
2. `buildTestApp().app`
3. `seedTestUser()` then `authenticatedRequest(app, jwtCookie)` (`Cookie: jwt=...`)
4. Hit production URLs (`/api/sync/task`, `/api/files/image`, …)
5. Assert HTTP status, the DTO from `@brainassistant/contracts`, and the document read back through the model

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

Cover the happy path, validation failure (`name` + `message` in the body), unauthenticated `401`, and external-service failure. Specs must be deterministic: no real network, no assertions on wall-clock time.

## Unit tests

Allowed without HTTP or Mongo for:

- domain entities and value objects (`Task.create` / `update`, `UserEmail`, `Guard`)
- mappers (`TaskMapper.toDomain` / `toPersistence` / `toDTO`)

They live in `test/unit/`, named `<subject>.spec.ts`, and call the real class.

## Environment

`setup-env.ts` (Jest `setupFiles`) sets `AUTHENTICATION_STRATEGY=JWT`, `JWT_SECRET`, `FILES_UPLOAD_PATH`, and dummy Google / SendGrid / Mailgun / OpenAI keys so `createApp()` can boot without `.env`.

## CI

`.github/workflows/backend-tests.yml` runs ESLint and Jest on push/PR when `backend/**` or `contracts/**` change (Node 18 and 20).
