---
name: implement-backend-feature
description: Step-by-step workflow for adding or changing a backend endpoint or business flow in the Express use-case architecture. Use when implementing a new API endpoint, use case, repository method or Mongoose-backed feature under backend/src/modules.
---

# Implement a backend feature

Process only. What correct backend code looks like is defined in `.cursor/rules/backend-architecture.mdc`, `mongodb.mdc` and `typescript-type-vs-interface.mdc` — do not restate those rules, follow them.

Run every command from `backend/`. The shell is PowerShell: separate commands with `;`, never `&&`.

## Checklist

```
- [ ] 1. Read a neighbouring use case
- [ ] 2. Decide the HTTP contract
- [ ] 3. Persistence layer (only if new data is stored)
- [ ] 4. Use-case folder
- [ ] 5. Wire the route
- [ ] 6. Integration test
- [ ] 7. lint / typecheck / test
- [ ] 8. Review the diff
```

## 1. Read a neighbouring use case first

`backend/AGENTS.md` names the canonical reference for each kind of endpoint — write, read, external service, binary response — and the modules that must not be used as a template. Open the one that matches what you are building and read every file in that folder before writing any code.

If the feature is close to an existing flow, mirror that flow instead of the reference. Naming varies slightly between modules (a few use `_index.ts`) — match the neighbours you are joining, not this document.

## 2. Decide the HTTP contract

If the endpoint is public-facing, its request and response types belong in `contracts/`, not in a local `*.dto.ts`. Follow `change-contract` for that part, including the rebuild step — the backend reads `contracts/dist/`, so a source-only contract edit is invisible.

`auth` still uses local `*.dto.ts` files. Extending an existing auth flow may legitimately mean staying with the local DTO; a new endpoint should use contracts.

## 3. Persistence layer (only if new data is stored)

1. Schema in `backend/src/shared/infra/database/mongodb/<entity>.model.ts`.
2. Register it in `IDbModels` **and** the `models` object in that folder's `index.ts` — repos resolve models from the injected registry.
3. Mapper in `backend/src/shared/mappers/<entity>.mapper.ts` (`toDomain`, `toPersistence`, `toDTO`).
4. Repo method in `backend/src/shared/repo/<entity>-repo.service.ts`.

Changing an existing schema instead of adding one? Stop and follow `change-mongodb-schema` — there are no migrations in this project.

## 4. Use-case folder

Create `backend/src/modules/<module>/usecases/<name>/` and build it in dependency order:

1. **Domain first.** Validation lives in the entity or value object via `Guard` + `Result`. Add the failure case to the entity's error enum. There is no validation library and no `*.validation.ts` layer.
2. `<name>.errors.ts` — `<Name>Errors` factories returning `Result.fail(new UseCaseError(...))` with `httpCode`. HTTP `name` strings belong in `@brainassistant/contracts` as `E<Name>UseCaseError` (re-export here). If the use case cannot fail yet, keep the file with `type XxxError = UseCaseError<never>`.
3. `<name>.usecase.ts` — implements `UseCase<Params, Promise<Result>>`, takes repos and services through the constructor, returns `Result`. No Express types cross this boundary.
4. `<name>.mapper.ts` — only when request-to-params mapping is non-trivial.
5. `<name>.controller.ts` — extends `BaseController`, reads `req.user`, branches on `result.isSuccess`, keeps the `try/catch`.
6. `index.ts` — the composition root. Instantiate repos and services, then the use case, then the controller, and export the controller singleton. There is no DI container; this file is the wiring.

## 5. Wire the route

Add the route in `backend/src/modules/<module>/routers/`. Routers hold no logic.

A brand-new module also needs mounting in `backend/src/shared/infra/http/api/index.ts`. Check there whether the route belongs behind `isAuthenticated` — everything under `/api/sync` is.

## 6. Integration test

Integration is the default in this project; follow `write-integration-test`. Cover the happy path, the validation failure, and the failure of any external service the use case calls.

## 7. Verify

```powershell
npm run lint:check
npm run typecheck
npm test
```

Narrow the test run while iterating: `npm test -- <spec-file>`. There is no `build` script — `typecheck` is the compile check, and `compile` would start the server.

`backend/tsconfig.json` has `strict` and `noUncheckedIndexedAccess`. Annotate parameters and return types explicitly; do not use `any` or `!` to silence the compiler.

## 8. Review the diff

Before reporting done, re-read your own diff for the two failures that pass lint and tests: a relative import missing the `.js` extension, and a contract annotation dropped at the controller boundary because inference "already works".
