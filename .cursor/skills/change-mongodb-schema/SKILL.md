---
name: change-mongodb-schema
description: Workflow for adding, changing or removing a Mongoose field, schema or index, including impact on existing documents and offline clients. Use when editing anything under backend/src/shared/infra/database/mongodb or when a feature needs a new persisted field.
---

# Change a MongoDB schema

Process only. Data-access rules are in `.cursor/rules/mongodb.mdc` — follow them, do not restate them.

**This project has no migration tooling and no migration scripts.** Nothing rewrites existing documents when a schema changes. Combined with offline clients that sync against these shapes, that makes a schema edit a compatibility decision, not a typing exercise. Work through the questions below *before* editing the schema file.

## Checklist

```
- [ ] 1. Classify the change
- [ ] 2. Answer the four compatibility questions
- [ ] 3. Edit schema + registry
- [ ] 4. Mapper and domain
- [ ] 5. Repo and queries
- [ ] 6. Indexes
- [ ] 7. Contract and client impact
- [ ] 8. Tests
- [ ] 9. Report the migration story
```

## 1. Classify the change

- **Additive** — a new optional field on an existing schema, or a whole new schema. Low risk.
- **Destructive** — renaming, removing, retyping a field, or changing what a stored value means. High risk, and the default answer is: add a new field instead and leave the old one alone.

## 2. Answer the four compatibility questions

Write the answers into your response. If you cannot answer one, stop and ask rather than guessing.

1. **Existing documents** — what does a document written before this change look like now? Does reading it through the mapper produce `undefined` where the domain expects a value?
2. **Backfill** — do old documents need a value? There is no migration runner, so the realistic options are: make it optional, default it in the mapper, or write a one-off script and say so explicitly.
3. **Old clients** — an offline PWA client running a previous build syncs against this shape. Does it still parse what the server sends, and does the server still accept what it sends?
4. **Persisted client state** — NGXS persists every slice to the device. If this field reaches the frontend model, old stored state lacks it; selectors and defaults must tolerate that.

## 3. Edit schema and registry

Schema in `backend/src/shared/infra/database/mongodb/<entity>.model.ts`.

A new schema must also be added to `IDbModels` **and** the `models` object in that folder's `index.ts` — repos read models from the injected registry, so an unregistered model is invisible to them.

Mind the id types: `Task` and `Client` use a string `_id`, `User` uses a real `ObjectId` converted in `user.repo.ts`. Be explicit about which you are dealing with.

## 4. Mapper and domain

Update `backend/src/shared/mappers/<entity>.mapper.ts` in all three directions you actually use (`toDomain`, `toPersistence`, `toDTO`). `toDomain` is where an absent legacy field must be handled — that is the boundary old documents come through.

If the field is part of domain invariants, add its validation to the entity with `Guard` + `Result`, and add the failure to the entity's error enum.

## 5. Repo and queries

New queries need an explicit bound: a `userId` filter, a time window, or a limit. Prefer atomic operators over read-modify-write, and never query inside a loop.

## 6. Indexes

The existing schemas define no indexes at all. If you added a query that filters or sorts on a growing field — anything keyed by `userId`, `modifiedAt`, `occurredAt` — state whether an index is needed and add it deliberately. Do not add indexes speculatively.

## 7. Contract and client impact

If the field crosses the wire, it belongs in `contracts/` and needs the rebuild — follow `change-contract`. A stored field that is deliberately *not* exposed to clients is a fine outcome; say which one you chose.

## 8. Tests

Extend the integration spec for the flow that writes the field, and assert it by reading the document back through the model. If old documents are meant to keep working, add a case that seeds a document without the field and reads it back.

```powershell
cd backend; npm run typecheck; npm test
```

## 9. Report the migration story

Finish with the concrete answers from step 2: what happens to existing documents, whether a backfill is needed, and what an old offline client sees. "It compiles" is not a migration story.
