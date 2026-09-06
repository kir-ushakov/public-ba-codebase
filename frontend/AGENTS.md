# Frontend

Angular 19 PWA: standalone components, NGXS state, offline-first with a change queue, packaged for
Android through Capacitor. Bootstrapped in `src/main.ts` — there are no NgModules.

The conventions this code must follow are in `.cursor/rules/angular.mdc` and `ngxs.mdc`; the
workflow for adding a feature is `.cursor/skills/implement-frontend-feature/`. This file is neither:
it says where things live and which existing code to imitate.

Run every command from `frontend/`. PowerShell — separate commands with `;`, never `&&`.

## Where things are

```
src/app/
├── mobile-app/             the live shell — routes come from mobile-app.routing.ts
│   └── components/
│       ├── common/         reusable pieces of the mobile UI
│       └── screens/        one folder per screen: component + template + scss + state
├── desktop-app/            present but NOT routed from main.ts
└── shared/
    ├── components/         redirects/, ui-elements/
    ├── features/           self-contained features (api + components + state + facade)
    ├── state/              global slices: app, user, tasks, sync
    ├── services/           api/, application/, auth/, infrastructure/, integrations/,
    │                       pwa/, utility/, adapters/, device-detector/
    ├── models/ mappers/    domain models and DTO ↔ model conversion
    ├── constants/          api-endpoints.const.ts
    └── dto/ forms/ pipes/ helpers/
```

`main.ts` registers exactly four global slices — `AppState`, `UserState`, `SyncState`, `TasksState` —
and `withNgxsStoragePlugin({ keys: '*' })`, so every slice, including screen and feature slices, is
persisted on the device.

Tests: state specs in `tests/unit/state/`, mocked Playwright specs in `e2e/` (guide in
`e2e/README.md`), live two-client specs in `e2e-live/`.

## Canonical references

Existing code to open and imitate when building something of the same kind. Copy the structure, not
the business logic.

### Self-contained feature → `src/app/shared/features/voice-input/`

The newest architecture in this app and the template for a feature that could later be lifted out:
`api/`, `components/`, `state/` and a facade in one folder. Shows a feature-scoped NGXS slice holding
only process status, workflow orchestration inside action handlers, `inject()` throughout, errors
surfaced by dispatching `AppAction.ShowErrorInUI`, and — in `voice-recording.facade.ts` — the
boundary that keeps the feature from depending on device infrastructure directly.

Two parts of it are not exemplary: `components/voice-input-trigger/` subscribes to dialog outputs
without `takeUntilDestroyed()`, and `api/speech-to-text.service.ts` declares its own response type
and builds the URL inline instead of using `@brainassistant/contracts` and `api-endpoints.const.ts`.
Follow the API-service reference below for that half.

### Screen with a screen-scoped slice → `src/app/mobile-app/components/screens/mb-task-screen/`

The fullest screen: component, template, SCSS, sub-components, `*.actions.ts` and `*.state.ts` in one
folder, registered on the route with `provideStates([...])`. Shows the intended division of labour —
the screen slice owns view mode and form data, reads other slices through `selectSnapshot`, and
dispatches `TasksAction.*` instead of writing entities itself, then resets to defaults on close.

### Synced entity, both directions → `src/app/shared/state/tasks.state.ts`

The template for any entity that syncs. Outbound: an optimistic update through
`patch` / `append` / `updateItem` / `removeItem` followed by
`SyncAction.ChangeForSyncOccurred`. Inbound: `@Action(SyncAction.ServerChangesLoaded)` filtering by
`EChangedEntity` and merging with `iif(...)` for insert-or-update. Both halves are required; the
inbound one is the half that gets forgotten.

### API service → `src/app/shared/services/api/server-changes.service.ts`

Endpoint from `api-endpoints.const.ts`, request and response typed with the contract namespace, and
the DTO mapped to a model inside `pipe(map(...))` so no DTO ever reaches NGXS state.
`client-changes.service.ts` next to it is the map of which endpoint each synced entity posts to.

### Device / platform abstraction → `src/app/shared/services/pwa/voice-recorder/`

An interface, a web and a native implementation selected at runtime via `Capacitor.isNativePlatform()`,
recording strategies behind them, and a small state machine guarding invalid transitions. The shape
to follow for anything that touches a browser or device API, so E2E can stub it.

### Mapper → `src/app/shared/mappers/task.mapper.ts`

Static `toModel` / `toDto` on a class, contract DTO in, plain model out.

### State spec → `tests/unit/state/tasks.state.spec.ts`

`TestBed` with `provideStore([...])`, `store.reset({...})` to establish the starting state,
`firstValueFrom(store.dispatch(...))` to await a handler, and assertions taken from
`store.selectSnapshot(...)`. Covers both directions — local create/update/delete and a merge of
`SyncAction.ServerChangesLoaded`.

### E2E spec → `e2e/create-task.spec.ts` with `e2e/utils/api-mocks.util.ts`

The fullest mocked flow: `setupApiMocks(page)` first, `data-test` selectors, `page.waitForResponse`
registered before the click that triggers it, then the outgoing payload inspected via
`request().postDataJSON()`. `e2e/utils/task-flow.util.ts` holds the reusable sign-in and
create-task steps; `edit-task`, `delete-task` and `sync-error` are the variants.

## Not references

Existing code that works but must not be used as a template.

- **`src/app/shared/state/sync.state.ts`** — the sync engine. Read it to understand the protocol; do
  not imitate it. It logs with `console.log` / `console.error`, carries several `TODO` blocks with
  ticket links, owns a `setInterval` inside the state class, and one of its actions is misspelled in
  both the class name and the type string (`SyncinhriniziationWasFailed`,
  `'[Sync] Syncinhriniziation Was Failed'`). Leave the existing spelling alone unless you were asked
  to rename it; never reproduce it in a new action.
- **`src/app/desktop-app/`** — not reachable: `main.ts` routes `mobileRoutes` only. One of its files
  is even named `dt-home-screencomponent.ts`. Do not add features here unless explicitly asked.
- **`src/app/shared/dto/`** — legacy. `task.dto.ts` only re-exports `TaskDTO` from contracts, and
  `user.dto.ts` still duplicates the shape locally. New payload types go in `contracts/`.
