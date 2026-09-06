---
name: change-contract
description: Workflow for editing the shared @brainassistant/contracts package - adding or changing DTOs, enums and endpoint contracts, rebuilding dist, and updating both apps. Use when a change touches contracts/src, an HTTP payload shape, or a type shared between frontend and backend.
---

# Change a shared contract

Process only. Layout and compatibility rules are in `.cursor/rules/contracts.mdc` — follow them, do not restate them.

`contracts/` is a separate npm package linked into both apps as `file:../contracts`, and **the apps import compiled `dist/`**. A source-only edit changes nothing until it is rebuilt. This is the step that gets forgotten and produces confusing "the type is right there" errors.

## Checklist

```
- [ ] 1. Classify the change
- [ ] 2. Edit contracts/src and export it
- [ ] 3. Rebuild
- [ ] 4. Update backend
- [ ] 5. Update frontend
- [ ] 6. Verify both apps
- [ ] 7. Report compatibility
```

## 1. Classify the change

Answer before writing code, because it decides whether the change is allowed as-is:

- **Additive** — new optional field, new DTO, new enum member, new contract namespace. Safe.
- **Breaking** — renaming a field, making an optional field required, removing anything, changing what an existing enum value means.

The frontend is an offline PWA. Old clients keep running cached builds and hold data in the old shape in persisted NGXS state. A breaking change is not a refactor here; if one looks unavoidable, say so and describe what happens to old clients and already-stored data before implementing it.

## 2. Edit `contracts/src` and export it

- `src/dto/<name>.dto.ts` — payload shapes, `type` not `interface`
- `src/enums/<name>.enum.ts` — enums crossing the wire
- `src/contracts/<name>.contract.ts` — the per-endpoint namespace with `Request` / `Response`

Add it to the folder barrel **and** `src/index.ts`. Anything not re-exported from `src/index.ts` does not exist as far as the apps are concerned.

Keep the package types-only: no validation, no mappers, no runtime logic, no dependencies.

## 3. Rebuild

```powershell
cd contracts; npm run build
```

Run `npm test` here too — it rebuilds and asserts the public API shape, which catches a missing barrel export immediately.

## 4. Update backend

Consume the contract at the controller boundary with explicit `FooContract.Request` / `FooContract.Response` annotations. Keep them even when inference would work; they document the public API.

Map the DTO into use-case params in `*.mapper.ts`, and out of the domain in `shared/mappers/<entity>.mapper.ts` (`toDTO`). The contract type must not travel into the use case.

## 5. Update frontend

Update the API service in `shared/services/api/` and the mapper in `shared/mappers/`. Enums from contracts can be reused directly in `shared/models/`; DTOs are mapped to models and never stored in NGXS state as-is.

If E2E mocks return this payload, update `frontend/e2e/utils/api-mocks.util.ts` — it is typed against the contract and mirrors the real backend's status codes.

## 6. Verify both apps

```powershell
cd backend; npm run typecheck; npm test
cd ../frontend; npm test; npm run build-prod
```

If either app cannot see a new export, the rebuild in step 3 did not happen or the barrel export is missing.

## 7. Report compatibility

Finish by stating explicitly whether the change is additive or breaking, and — when it is breaking — what an old cached client does when it meets the new payload.
