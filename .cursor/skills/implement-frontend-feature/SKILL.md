---
name: implement-frontend-feature
description: Step-by-step workflow for adding or changing a screen, component or state slice in the Angular NGXS PWA. Use when implementing frontend UI, a new route, an NGXS slice, or an API call under frontend/src/app.
---

# Implement a frontend feature

Process only. What correct frontend code looks like is defined in `.cursor/rules/angular.mdc` and `ngxs.mdc` — do not restate those rules, follow them.

Run every command from `frontend/`. The shell is PowerShell: separate commands with `;`, never `&&`.

## Checklist

```
- [ ] 1. Read a neighbouring screen
- [ ] 2. Decide which state layer owns this
- [ ] 3. Model, mapper and API service
- [ ] 4. Actions and state handlers
- [ ] 5. Component and route
- [ ] 6. Sync impact
- [ ] 7. Tests
- [ ] 8. lint / test / build
```

## 1. Read a neighbouring screen

`frontend/AGENTS.md` names the canonical reference for each kind of work — a screen with its own state, a self-contained feature, a synced entity, an API service, a device abstraction — plus the code that must not be copied. Open the matching one and read the whole folder first.

`mobile-app/` is the live shell. `desktop-app/` exists but is not routed from `main.ts` — do not add features there unless asked explicitly.

## 2. Decide which state layer owns this

Three layers, and picking wrong is the usual mistake:

| Layer | Where | Owns |
|-------|-------|------|
| Screen state | next to the screen, registered on the route with `provideStates([...])` | form values, view mode, UI orchestration |
| Domain state | `shared/state/` (`tasks`, `user`, `sync`, `app`), registered in `main.ts` | entities, optimistic updates, enqueuing sync changes |
| Component signal | inside the component | local UI only — never domain data |

Screen state orchestrates and dispatches into domain state; it does not own entities. `MbTaskScreenState.handleCreateTask` dispatching `TasksAction.CreateTask` is the pattern.

Every slice is persisted to the device (`withNgxsStoragePlugin({ keys: '*' })`), so treat any new state field as a stored-data shape change: keep it serializable, and make defaults and selectors tolerate state written by an older build.

## 3. Model, mapper and API service

For data crossing the network:

1. Wire types come from `@brainassistant/contracts`. Need a new one? Follow `change-contract`, rebuild included.
2. Frontend model in `shared/models/<name>.model.ts` — a `type`, reusing enums from contracts.
3. Mapper in `shared/mappers/<name>.mapper.ts` for DTO ↔ model. DTOs must not leak into state.
4. Endpoint constant in `shared/constants/api-endpoints.const.ts`.
5. API service in `shared/services/api/<name>.service.ts`, typed with the contract namespace.

Do not add DTOs to `shared/dto/` — it only re-exports from contracts for legacy reasons.

## 4. Actions and state handlers

Actions go in a namespace with a `[Scope] Human readable` type string, in `*.action.ts` or `*.actions.ts` — follow the neighbouring file, both spellings exist.

Slices talk by dispatching actions, never by injecting each other. A global slice handling a screen's action is the preferred direction.

## 5. Component and route

Standalone component with its own `imports`. Add the route in `mobile-app/mobile-app.routing.ts`, with `providers: [provideStates([...])]` if it has screen state.

Add `data-test` attributes to anything E2E will need to click or read, while you are in the template — retrofitting them later is what makes E2E specs reach for CSS classes.

## 6. Sync impact

If the feature creates, updates or deletes a synced entity, the domain state must update optimistically **and** dispatch `SyncAction.ChangeForSyncOccurred`. Read `shared/state/tasks.state.ts` for the shape.

Then check the receiving side: inbound server changes are applied in the same slice via `SyncAction.ServerChangesLoaded`. A new entity type needs both directions plus a backend endpoint — see `implement-fullstack-feature`.

## 7. Tests

State logic gets a Jest spec in `frontend/tests/unit/state/<slice>.spec.ts`, using `TestBed` with `provideStore([...])` and `store.reset({...})`. Follow `tasks.state.spec.ts`.

A user-visible flow gets a Playwright spec — follow `add-e2e-test`.

## 8. Verify

```powershell
npm run lint:check
npm run lint:style
npm test
npm run build-prod
```

E2E is a separate, slower loop (`npm run e2e`); run it when you touched a flow that specs cover.
