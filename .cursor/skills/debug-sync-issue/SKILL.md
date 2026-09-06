---
name: debug-sync-issue
description: Diagnostic workflow for offline sync problems in the PWA - changes stuck in the queue, data not reaching the server, server changes not appearing, duplicated or vanishing tasks, clientId errors, images not uploading. Use when investigating anything about synchronization between the Angular client and the backend.
---

# Debug a sync issue

A map plus a diagnosis order. Sync spans NGXS state, persisted device storage, an HTTP queue, the backend sync module and IndexedDB, so the usual failure is looking in the wrong layer for twenty minutes. Locate the layer first, then read code.

## How sync actually runs

`frontend/src/app/shared/state/sync.state.ts` is the engine. One cycle, triggered every 20 seconds (`SYNC_PERIOD`) by a timer started on `AppAction.Opened`, and also immediately whenever a change is queued:

1. If there is no `clientId`, request one (`ClientIdService.releaseClientId()`).
2. **Pull**: `ServerChangesService.fetch(clientId)` → dispatch `SyncAction.ServerChangesLoaded(changes)`; domain slices merge them.
3. **Push**: iterate `state.changes` and send each via `ClientChangesService.send(change)`, dispatching `SyncAction.LocalChangeWasSynchronized(change)` to dequeue it.
4. `lastTime` is stamped, then `ImageService.uploadImages()` flushes pending image blobs.

Two behaviours to know before theorising:

- **The push loop stops at the first failure.** A non-404 error dispatches `SyncAction.SyncinhriniziationWasFailed` and returns, leaving that change and everything behind it queued for the next tick. One poisoned change blocks the whole queue. (The action name is misspelled in the source — search for it exactly.)
- **404 is special.** A 404 while pushing means the entity is gone server-side, so the client synthesizes a local delete. A 404 elsewhere in the cycle resets `clientId` to `null` and re-runs. Both paths are noted as relying on status codes alone, tickets BA-258.

## Files by layer

| Layer | File |
|-------|------|
| Engine, queue, retry | `shared/state/sync.state.ts`, `sync.action.ts` |
| Outbound HTTP | `shared/services/api/client-changes.service.ts` |
| Inbound HTTP | `shared/services/api/server-changes.service.ts` |
| Client identity | `shared/services/api/client-id.service.ts` |
| Merge of inbound changes | `shared/state/tasks.state.ts` (`SyncAction.ServerChangesLoaded`) |
| Endpoints | `shared/constants/api-endpoints.const.ts` |
| Images | `shared/services/application/image.service.ts`, `infrastructure/image-db.service.ts`, `database.service.ts` (`ba-db` / `images`) |
| Online/offline flag | `app.component.ts` → `AppState.online` |
| Backend | `backend/src/modules/sync/usecases/`, `routers/index.ts` |

## Diagnosis order

Work down this list; do not skip to the backend.

1. **Is the change queued at all?** Inspect `sync.changes` in state. Empty means the domain slice never dispatched `ChangeForSyncOccurred` — the bug is in the feature, not in sync.
2. **Is the cycle running?** `lastTime` should advance every 20 seconds. Frozen means the timer never started (no `AppAction.Opened`) or was cleared by `UserAction.LoggedOut` / `AppAction.UserNotAuthenticated`.
3. **Is the queue stuck behind one change?** If `changes` keeps growing and the first entry never leaves, that first entry is failing. Look for `Sync Pending Change Error` in the console — it logs the change and the error.
4. **Is it the request or the response?** Check the actual status. 401 means the JWT cookie is gone (an auth problem wearing a sync costume). 400 means the backend rejected the payload — compare against the DTO in `contracts/`. 404 triggers the special paths above.
5. **Inbound only?** If pushing works but server changes never appear, the problem is in `fetch` or in the slice's `ServerChangesLoaded` handler, not in the queue.
6. **Backend side.** Only now read `backend/src/modules/sync/usecases/` and check what the get-changes query is scoped by (`userId`, `modifiedAt`, `clientId`).

## Two traps specific to this project

**Persisted state.** `withNgxsStoragePlugin({ keys: '*' })` persists every slice, including the sync queue and `clientId`. A user's device can hold a queue written by an older build with an older shape. When reproducing, consider clearing site data — and when fixing, remember old stored queues must still be handled.

**Images are not in NGXS.** Image blobs live in IndexedDB (`ba-db`, store `images`, `uploaded` index) and are uploaded at the end of the cycle. A task that syncs while its picture does not is an `ImageService` problem, not a sync-queue problem.

## Confirm the fix with a test

Reproduce in a spec rather than by hand:

- queue and retry behaviour → `frontend/tests/unit/state/sync.state.spec.ts`
- a failing push from the user's point of view → `frontend/e2e/sync-error.spec.ts`, which uses `setupApiMocks(page, { failTaskSync: true })`
- the server contract → the integration specs in `backend/test/integration/sync/`

Never "fix" sync by disabling the interval, widening a catch, or dropping changes from the queue. Queued changes are unsaved user data.
