---
name: review-changes
description: Workflow for reviewing a diff in this repo against its architecture, offline-compatibility and testing conventions. Use when asked to review changes, check a branch before a PR, or verify work just completed.
---

# Review changes

Process only. The standards themselves live in `.cursor/rules/` — this skill is the order to check them in and the failures that are specific to this repo.

## Checklist

```
- [ ] 1. Get the diff and its scope
- [ ] 2. Compatibility first
- [ ] 3. Layering
- [ ] 4. Repo-specific traps
- [ ] 5. Tests
- [ ] 6. Run the checks
- [ ] 7. Report by severity
```

## 1. Get the diff and its scope

```powershell
git status; git diff; git diff --stat main...HEAD
```

First question: does the diff match what was asked? Flag drive-by renames, unrelated refactors and reformatted files as scope problems even when the code is fine.

Note which packages are touched — `contracts/`, `backend/`, `frontend/` — because that decides which of the following sections apply.

## 2. Compatibility first

The highest-cost mistakes in this repo are invisible to the compiler and to the tests.

- **Contracts.** Any change to `contracts/src` that renames a field, makes an optional field required, removes anything, or changes the meaning of an enum value is breaking for clients running cached builds. Was it flagged as such? Was `contracts` rebuilt so both apps actually see it?
- **MongoDB.** There are no migrations. A changed or removed field means existing documents no longer match. Does the diff say what happens to them?
- **Persisted state.** NGXS persists every slice (`keys: '*'`). New or renamed state fields meet state written by an older build — do defaults and selectors tolerate that?
- **Secrets.** No hard-coded URLs, credentials or keys; no logging of passwords, tokens or whole request bodies.

## 3. Layering

Backend, per `backend-architecture.mdc` and `mongodb.mdc`: use cases free of Express types, no Mongoose model reached directly outside a repo, no raw document escaping a repo, errors returned as `Result` rather than thrown, no new layer invented next to the use-case folders, validation in the domain via `Guard` rather than a new library.

Frontend, per `angular.mdc` and `ngxs.mdc`: no `HttpClient` in a component, domain data in NGXS rather than component signals, slices communicating by dispatching rather than injecting each other, DTOs mapped to models instead of stored raw, manual subscriptions torn down.

Queries: every query returning a collection needs an explicit bound; no filtering or sorting in JavaScript that MongoDB could do; no query inside a loop.

## 4. Repo-specific traps

These pass lint and tests and still break things:

- A relative import in `backend/` missing the `.js` extension — it compiles and fails at runtime.
- A `FooContract.Request` / `FooContract.Response` annotation deleted from a controller as "redundant". It documents the public API; it stays.
- A `type` converted to `interface` (or back) for consistency. House style: `type` for shapes, `interface` for contracts a class implements.
- A new mocked unit test for a controller, use case or repo. This project tests those through integration.
- E2E mocks that no longer mirror the backend's real status codes and bodies.
- `page.waitForTimeout()` in a Playwright spec, or `data-testid` instead of `data-test`.
- Backend types left loose because `tsconfig` has no `strict` to catch them.

## 5. Tests

Does the changed behaviour have coverage in the right place — integration in `backend/test/integration/` for a backend flow, a state spec in `frontend/tests/unit/state/` for state logic, a Playwright spec for a user-visible flow? Unit tests in `backend/test/unit/` are only for pure domain models and mappers.

Check the assertions, not just the presence of a spec: an integration test that never reads the document back through the model has not tested persistence.

## 6. Run the checks

Only for packages the diff touches:

```powershell
cd contracts; npm run build; npm test
cd ../backend; npm run lint:check; npm run typecheck; npm test
cd ../frontend; npm run lint:check; npm run lint:style; npm test; npm run build-prod
```

## 7. Report by severity

Group findings so the author knows what blocks a merge:

- **Blocking** — breaks behaviour, breaks old clients or stored data, leaks secrets, violates an architecture rule.
- **Should fix** — missing coverage, loose types, an unbounded query that will grow.
- **Optional** — naming and readability.

Point at the file and line and say what to do instead. If the diff is clean, say so plainly rather than manufacturing findings.
