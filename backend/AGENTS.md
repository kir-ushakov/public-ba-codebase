# Backend

Express + Mongoose API. ESM (`"type": "module"`), use-case architecture, no DI container, no
central error middleware. Entry points: `server.ts` → `src/app.ts` → `src/create-app.ts`.

The conventions this code must follow are in `.cursor/rules/backend-architecture.mdc`,
`mongodb.mdc`, `backend-domain-values.mdc` and `typescript-type-vs-interface.mdc`. The workflow for
adding a feature is `.cursor/skills/implement-backend-feature/`. This file is neither: it says where
things live and which existing code to imitate.

Run every command from `backend/`. PowerShell — separate commands with `;`, never `&&`. There is no
`build` script: `npm run typecheck` is the compile check, `npm run compile` starts the server.

## Where things are

```
src/
├── config/                 env-backed configuration
├── loaders/                mongoose, ngrok
├── modules/<module>/
│   ├── routers/            HTTP wiring only
│   ├── services/           module-local services
│   └── usecases/<name>/    controller + usecase + errors + mapper + index
└── shared/
    ├── core/               Result, Guard, UseCase, UseCaseError, serviceFail
    ├── domain/             Entity, ValueObject, models/, values/
    ├── infra/              auth (Passport), database/mongodb, http, integrations
    ├── mappers/            toDomain / toPersistence / toDTO per entity
    ├── repo/               the only place Mongoose models are touched
    └── services/, types/, utils/
```

Modules: `auth`, `sync`, `files`, `ai`, `integrations` (`google`, `slack`). Routes are mounted in
`src/shared/infra/http/api/index.ts`; everything under `/api/sync`, `/api/files` and `/api/ai` sits
behind `isAuthenticated`.

Tests live in `test/` and have their own guide in `test/README.md`.

## Canonical references

Production code to open and imitate when building something of the same kind. These are examples of
shape, not of business logic — copy the structure, never the domain rules.

### Write endpoint on the sync protocol → `src/modules/sync/usecases/task/create/`

The complete five-file use-case folder, and the default template for a new endpoint. Shows the
contract type at the HTTP boundary (`SendChangeContract.Request<TaskDTO>`), request mapping split
into `create-task.mapper.ts`, validation delegated to `Task.create` returning a `Result`, error
factories in `create-task.errors.ts` that return `Result.fail` with `httpCode`, repos injected
through the constructor, and `index.ts` as the single composition root that instantiates everything
and exports the controller.

Do not copy the commented-out Slack block and its `TODO` / `TICKET` comments at the end of
`create-task.usecase.ts`.

### Read endpoint → `src/modules/sync/usecases/get-changes/`

The reference for a query-string request and for keeping the contract visible on the way out:
`const response: GetChangesContract.Response = ...` before `this.ok(res, response)`. Also shows
`requestToUsecaseParams` and `usecaseResultToResponse` as private controller methods, which is the
right home for mapping too small to deserve its own file.

Do not copy the class name `GetChnagesController`. The typo is not the convention.

### Use case wrapping an external service → `src/modules/ai/usecases/speech-to-text/`

How a third-party failure becomes a typed use-case error: the service returns a `Result`, the use
case switches on `error.code` and re-wraps it into its own `SpeechToTextErrors` rather than letting
the provider's error escape. Also the case where a local `*.dto.ts` is legitimate — a multipart
audio upload with no shared contract.

### Binary response → `src/modules/files/usecases/get-image/`

A controller that answers with bytes instead of JSON: `res.writeHead(200, file.headers)` and
`file.data.pipe(res)` on success, the usual `jsonResponse` on failure. Reference for the response
half only — see the note on `upload-image` below before copying the request half.

### Webhook with signature verification → `src/modules/integrations/slack/`

Router-level middleware (`verification-challenge.function.ts`) in front of the controller, plus a
module that owns its own enums and DTO for a payload that never reaches the frontend.

### Domain validation → `src/shared/domain/models/task.ts`, `src/shared/domain/values/user/user-email.ts`

Where input validation lives in this project: a `create()` factory, `Guard`, a `Result` return and an
error enum. There is no validation library and no layer above the domain that does this.

### Persistence pair → `src/shared/repo/task-repo.service.ts` + `src/shared/mappers/task.mapper.ts`

A repo resolving models from the injected `models` registry, and the mapper that keeps raw documents
from escaping it. `getChanges` + `toDomainIfValid` is the shape for a collection pull: the public
method is query → map → return; a poison document is logged with `serviceFail` and omitted, not
turned into HTTP failure. Write-time rules stay on `Task.create` / `update`.

### Integration spec → `test/integration/sync/task-create.int.spec.ts`

What a finished spec looks like: the in-memory Mongo lifecycle, `seedTestUser()` +
`authenticatedRequest()`, and three cases — unauthenticated `401`, the happy path, and a rejected
DTO asserted on status plus `name` and `message`. The happy path is the one to imitate closely: it
checks the response body against the contract DTO **and** reads the document back through
`models.TaskModel`, which is what separates an integration test from a controller echo.

`test/integration/_setup/harness.smoke.spec.ts` is the smaller starting point, and `test/README.md`
maps every helper.

## Not references

Existing code that works but must not be used as a template.

- **`src/modules/auth/usecases/`** — the oldest module. It predates `@brainassistant/contracts` and
  still carries local `*.dto.ts` files, and one folder is named `sing-up`. Extending an auth flow in
  place is fine; starting a new module from it is not.
- **Misspelled names already in the tree** —
  `slack-event-recieved.errors.ts`, `GetChnagesController`, `sing-up/`, and the live route
  `/api/integrations/slack/event-recived`. They stay as they are: renaming touches imports, and the
  Slack path is registered with a third party. Never reproduce the spellings in new files.
- **`src/modules/integrations/google/usecases/get-oauth-consent-screen/`** — a controller with no use
  case behind it. Acceptable for a pure redirect, misleading as a shape to copy.
- **`src/modules/files/usecases/upload-image/`** — the flow works, but `execute()` takes a second
  `user` argument that is not part of `UploadImageParams`, which breaks the single-params `UseCase`
  signature; limits sit in local constants marked `TODO: move to config`; and a failed Google Drive
  call is reported through `console.error`. Read it to understand image upload; do not take its
  shape as the pattern.
