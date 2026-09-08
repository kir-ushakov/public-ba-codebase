# Contracts

`@brainassistant/contracts` — the single source of truth for the HTTP boundary between `frontend` and
`backend`. Both apps link it as `file:../contracts` and **import the compiled `dist/`**, so a change
in `src/` is invisible until `npm run build` runs here.

The conventions are in `.cursor/rules/contracts.mdc`; the workflow is
`.cursor/skills/change-contract/`. This file says where things live and what to imitate.

Types only: no validation, no mappers, no runtime logic, no dependencies. The one runtime export is
`PUBLIC_API_SHAPE`, which exists for the shape test.

```powershell
npm run build          # required before either app sees a change
npm test               # rebuilds, then diffs the public API against test/public-api.shape.json
```

## Where things are

```
src/
├── dto/        api-response, auth, change, tag, task, user  (+ index barrel)
├── enums/      change-action, changed-entity, task-status, task-type, api-error  (+ index barrel)
├── contracts/  send-change, get-changes, files  (+ index barrel)
├── public-api.shape.ts   compile-time key lists + the snapshot payload
└── index.ts    the public surface — anything missing here does not exist for the apps
test/
├── public-api.shape.json   committed snapshot
└── public-api.shape.test.cjs
```

DTOs are re-exported from `src/index.ts` with `export type`, enums with a value `export`.

## Canonical references

### Endpoint namespace → `src/contracts/send-change.contract.ts`

The reference shape: one namespace per endpoint holding `Request` and `Response` as `type`, generic
over the entity DTO (`Request<T extends ChangeableObjectDTO>`), with a doc comment naming the actual
HTTP methods and paths it covers and spelling out the compatibility reasoning — why the response
returns the saved entity and why a cached PWA that ignores the body stays compatible. That last part
is the habit worth copying: this package is a public API, so the reasoning belongs next to the type.

`src/contracts/get-changes.contract.ts` is the same shape without the generic.

### Wire enum → `src/enums/changed-entity.enum.ts`

A small enum with explicit string values. Values are part of the wire format and of already-persisted
client state: add members, never repurpose or renumber existing ones.

HTTP `ApiErrorDto.name` strings live in `src/enums/api-error.enum.ts`. The `E` prefix is required.
The suffix marks the layer: `E<UseCase>UseCaseError`, domain `E<Entity>Error`, repo
`E<Repo>ServiceError`, app catch-all `EApiError`. Do not use `ErrorCode`. Add members, do not rename
wire values (`FILE_TOO_LARGE` stays `FILE_TOO_LARGE`). Internal-only codes stay in the backend.

### Guarding the public API → `src/public-api.shape.ts` + `test/public-api.shape.json`

How a breaking change is caught here rather than in production. Each DTO declares its keys with
`satisfies readonly (keyof T)[]` and an `ExactKeys` check, so removing or renaming a field fails
`tsc` first; then the exported `PUBLIC_API_SHAPE` is diffed against the committed JSON snapshot, so
the change also has to be acknowledged deliberately by updating the snapshot.

Every new DTO, enum or contract namespace gets an entry here. A snapshot updated without a sentence
explaining why is the thing to catch in review.

## Not references

- **`src/contracts/files.contract.ts`** — the contract itself is fine and in use, but it declares
  `export interface Request` where house style calls for a `type` for payload shapes, and its
  indentation is broken. Copy `send-change.contract.ts` instead.
- **`README.md`** — written for an earlier layout. It lists `send-change.dto.ts`,
  `get-changes.dto.ts` and `file.dto.ts` under `src/dto/`, none of which exist, and does not mention
  `src/enums/` or `src/contracts/` at all. Trust `src/` and this file over it.
