# API Contracts Flow

## Create Task Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports from @brainassistant/contracts:
                              │ - TaskDTO
                              │ - SendChangeContract
                              │
                              ▼
            POST /api/sync/task
            Content-Type: application/json
            Body: SendChangeContract.Request<TaskDTO>
            {
              changeableObjectDto: {
                id: "task-123",
                type: "TASK",
                title: "My Task",
                status: "OPEN",
                imageId?: "img-456"
              }
            }
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports from @brainassistant/contracts:
                              │ - TaskDTO
                              │ - SendChangeContract
                              │
                              ▼
            req.body: SendChangeContract.Request<TaskDTO>
            const dto: TaskDTO = req.body.changeableObjectDto
                              │
                              │ Process & Save to DB
                              │
                              ▼
            Response: 201 Created
            Body: SendChangeContract.Response<TaskDTO> (which is TaskDTO)
            {
              id: "task-123",
              userId: "user-456",
              type: "TASK",
              title: "My Task",
              status: "OPEN",
              imageId: "img-456",
              createdAt: "2025-10-14T12:00:00Z",
              modifiedAt: "2025-10-14T12:00:00Z"
            }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (receives)                           │
└─────────────────────────────────────────────────────────────────┘
            Response validated against TaskDTO
```

## Get Changes Flow (Sync)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports from @brainassistant/contracts:
                              │ - GetChangesResponseDTO
                              │ - ChangeDTO
                              │ - EChangedEntity, EChangeAction
                              │
                              ▼
            GET /api/sync/changes?clientId=abc123
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ imports from @brainassistant/contracts:
                              │ - ChangeDTO
                              │ - EChangedEntity, EChangeAction
                              │ - GetChangesResponseDTO
                              │
                              ▼
            Response: 200 OK
            Body: GetChangesResponseDTO
            {
              changes: [
                {
                  entity: EChangedEntity.Task,  // "CHANGED_ENTITY_TASK"
                  action: EChangeAction.Updated, // "CHANGE_ACTION_UPDATED"
                  object: {
                    id: "task-123",
                    userId: "user-456",
                    title: "Updated Task",
                    ...
                  }
                },
                {
                  entity: EChangedEntity.Task,
                  action: EChangeAction.Deleted,
                  object: {
                    id: "task-789",
                    modifiedAt: "2025-10-14T12:00:00Z"
                  }
                }
              ]
            }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (receives)                           │
└─────────────────────────────────────────────────────────────────┘
            Response validated against GetChangesResponseDTO
            Each change validated against ChangeDTO
```

## Contract Package Structure

```
@brainassistant/contracts
│
├── contracts/
│   └── file.contract.ts     ← ImageUploadRequest, ImageUploadResponse
│
├── dto/
│   ├── task.dto.ts          ← TaskDTO
│   ├── user.dto.ts          ← UserDto
│   ├── tag.dto.ts           ← TagDTO
│   ├── change.dto.ts        ← ChangeDTO, EChangedEntity, EChangeAction
│   ├── send-change.dto.ts   ← SendChangeRequestDTO ⭐, SendChangeResponseDTO
│   ├── get-changes.dto.ts   ← GetChangesRequestDTO, GetChangesResponseDTO
│   ├── auth.dto.ts          ← LoginRequestDTO, SignUpRequestDTO, etc.
│   └── api-response.dto.ts  ← ApiErrorDto, ApiSuccessDto
│
└── index.ts                 ← Public exports

Imported by:
  ├── backend/        → uses @brainassistant/contracts
  ├── frontend/       → uses @brainassistant/contracts
  └── e2e tests/      → uses @brainassistant/contracts
```

## The Key Insight: SendChangeRequestDTO

You correctly identified this as the **crucial wrapper**:

```typescript
// Every sync operation wraps the actual DTO in this structure
interface SendChangeRequestDTO<T> {
  changeableObjectDto: T;  // ← TaskDTO, TagDTO, etc.
}

// Used like:
POST /api/sync/task
{
  changeableObjectDto: taskDto  // ← The actual data
}

// Backend receives:
const actualData = req.body.changeableObjectDto;
```

This wrapper is **consistent across ALL sync endpoints**:
- `/api/sync/task` → `SendChangeRequestDTO<TaskDTO>`
- `/api/sync/tag` → `SendChangeRequestDTO<TagDTO>`
- etc.

## Benefits of Shared Contracts

### Before (Duplicated DTOs)
```
Frontend: TaskDTO { id, title, status, ... }
Backend:  TaskDTO { id, title, status, ..., extraField? }
                    ↑
                    Oops! They drifted apart
                    No compile-time error!
                    Runtime errors in production 💥
```

### After (Shared Contracts)
```
Contracts: TaskDTO { id, title, status, ... }
               ↓                    ↓
           Frontend             Backend
               ↓                    ↓
        Both import the same type
        
If backend tries to add extraField without updating contract:
  → TypeScript error ✅
  → Must also update frontend ✅
  → Impossible to drift apart ✅
```

### E2E Tests (The Original Problem)
```
Before:
  E2E Test mocks: { success: true }
  ❌ Mock doesn't match real API response
  ❌ Tests pass but production breaks

After:
  E2E Test mocks: TaskDTO
  ✅ Mock must match real API response
  ✅ TypeScript enforces correctness
  ✅ Tests catch contract violations
```

