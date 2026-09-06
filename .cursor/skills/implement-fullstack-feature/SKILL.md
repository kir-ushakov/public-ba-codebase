---
name: implement-fullstack-feature
description: End-to-end workflow for a feature spanning contracts, backend and the Angular PWA, including the offline sync protocol on both sides. Use when a task requires a new synced entity, a new API plus UI, or any change crossing more than one package.
---

# Implement a full-stack feature

The orchestration skill. It sequences the others; it does not repeat them.

- Backend detail → `implement-backend-feature`
- Frontend detail → `implement-frontend-feature`
- Contract detail → `change-contract`
- Schema detail → `change-mongodb-schema`

Three packages, and each is a separate npm project: run commands inside `contracts/`, `backend/` or `frontend/`, never from the repo root. PowerShell — chain with `;`, never `&&`.

## Why the order matters

The apps compile against `contracts/dist/`. Starting in the backend or the frontend means writing code against a type that does not exist yet, so work outside-in from the contract. And because the frontend is an offline PWA, "done" is not "it works on my machine after a hard refresh" — it is "an old cached client still works".

## Checklist

```
- [ ] 1. Trace the existing vertical slice
- [ ] 2. Decide the contract and compatibility
- [ ] 3. contracts/ + rebuild
- [ ] 4. Backend
- [ ] 5. Backend integration test
- [ ] 6. Frontend data layer
- [ ] 7. Sync, both directions
- [ ] 8. Frontend UI
- [ ] 9. Frontend tests
- [ ] 10. Full verification
- [ ] 11. Report compatibility
```

## 1. Trace the existing vertical slice

Read the create-task path end to end before writing anything. It is the template for any synced feature:

```
MbTaskScreenState.handleCreateTask
  -> TasksAction.CreateTask                (optimistic insert in shared/state/tasks.state.ts)
  -> SyncAction.ChangeForSyncOccurred      (queued in shared/state/sync.state.ts)
  -> ClientChangesService.send             (POST /api/sync/task)
  -> CreateTaskController -> CreateTask -> TaskRepoService -> TaskModel
  -> SyncAction.LocalChangeWasSynchronized (dequeued)
```

Name the files your feature will need at each hop before starting. If a hop has no equivalent in your feature, say why.

## 2. Decide the contract and compatibility

Write down the request and response shape, and whether the change is additive or breaking for clients running an old cached build with old persisted state. Decide this now — it constrains every later step.

## 3. `contracts/` and rebuild

Add DTOs, enums and the endpoint namespace, export from `src/index.ts`, then:

```powershell
cd contracts; npm run build
```

## 4. Backend

Use-case folder, repo, route. If a new entity is stored, the Mongoose schema and `IDbModels` registration happen here. Changing an existing schema is a separate decision — go through `change-mongodb-schema`.

## 5. Backend integration test

Write it now, not at the end. It pins the real status codes and payloads that the frontend E2E mocks must mirror; doing it later means the mocks encode a guess.

## 6. Frontend data layer

Model, mapper, endpoint constant, API service. Bottom-up, so the state slice has something to call.

## 7. Sync, both directions

Both halves are required, and the inbound one is the half that gets forgotten:

- **Outbound** — the domain state updates optimistically and dispatches `SyncAction.ChangeForSyncOccurred`; `ClientChangesService` must know the path for the new entity.
- **Inbound** — the slice handles `SyncAction.ServerChangesLoaded` and merges server changes; the backend get-changes flow must include the new entity.

A new synced entity also touches `EChangedEntity` in contracts.

## 8. Frontend UI

Component, route, `data-test` hooks.

## 9. Frontend tests

State spec in `frontend/tests/unit/state/`, and an E2E spec for the user-visible flow with mocks extended in `e2e/utils/api-mocks.util.ts` to match what step 5 pinned.

## 10. Full verification

```powershell
cd contracts; npm run build; npm test
cd ../backend; npm run lint:check; npm run typecheck; npm test
cd ../frontend; npm run lint:check; npm run lint:style; npm test; npm run build-prod
cd ../frontend; npm run e2e
```

## 11. Report compatibility

Close by stating what happens to a client that is still running the previous build with previously persisted state, and to documents already in MongoDB. If either breaks, say so plainly rather than burying it.
