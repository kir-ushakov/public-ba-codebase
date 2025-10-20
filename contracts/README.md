# @brainassistant/contracts

Shared API contracts and TypeScript DTOs for BrainAssistant frontend and backend.

## Purpose

This package ensures type safety and contract consistency between:
- Frontend (Angular)
- Backend (Node.js/Express)
- E2E tests (Playwright)

## Benefits

✅ **Single Source of Truth**: DTOs defined once, used everywhere
✅ **Compile-Time Safety**: TypeScript catches contract mismatches before runtime
✅ **Refactoring Confidence**: Change a DTO once, TypeScript errors guide all necessary updates
✅ **Self-Documenting**: Type definitions serve as API documentation

## Structure

```
contracts/
├── src/
│   ├── dto/
│   │   ├── task.dto.ts         # Task-related DTOs
│   │   ├── user.dto.ts         # User-related DTOs
│   │   ├── tag.dto.ts          # Tag-related DTOs
│   │   ├── change.dto.ts       # Change tracking DTOs & enums
│   │   ├── send-change.dto.ts  # Send change request/response
│   │   ├── get-changes.dto.ts  # Get changes request/response
│   │   ├── auth.dto.ts         # Authentication DTOs
│   │   ├── file.dto.ts         # File upload DTOs
│   │   └── api-response.dto.ts # Standard API responses
│   └── index.ts                # Public exports
├── package.json
└── tsconfig.json
```

## Usage

### In Backend

```typescript
import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';

// Controller
const requestDto: TaskDTO = req.body.changeableObjectDto;
const responseDto: SendChangeContract.Response<TaskDTO> = TaskMapper.toDTO(task);
res.status(201).json(responseDto);
```

### In Frontend

```typescript
import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';

// Service
createTask(dto: TaskDTO): Observable<TaskDTO> {
  return this.http.post<TaskDTO>('/api/sync/task', { changeableObjectDto: dto });
}
```

### In E2E Tests

```typescript
import { TaskDTO } from '@brainassistant/contracts';

// Mock with correct types
await page.route('**/api/sync/task', async (route) => {
  const response: TaskDTO = {
    id: 'task-123',
    userId: 'user-456',
    type: 'TASK',
    title: 'Test Task',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
  
  await route.fulfill({
    status: 201,
    contentType: 'application/json',
    body: JSON.stringify(response),
  });
});
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Clean

```bash
npm run clean
```

## Adding New DTOs

1. Create DTO file in `src/dto/`
2. Export types from `src/index.ts`
3. Run `npm run build`
4. Import in frontend/backend

## Version Management

When making breaking changes to contracts:
1. Update the version in `package.json` (follow semver)
2. Run `npm run build`
3. Update frontend and backend dependencies
4. Fix all TypeScript errors

## Best Practices

### DO ✅

- Keep DTOs simple and serializable (plain objects)
- Use `string` for dates (ISO 8601 format)
- Make optional fields explicit with `?`
- Document complex DTOs with JSDoc comments
- Use descriptive names (e.g., `TaskDTO` not `TaskInput`)

### DON'T ❌

- Don't include business logic in DTOs
- Don't use classes (use interfaces/types)
- Don't include methods or functions
- Don't use Date objects (use ISO strings)
- Don't couple DTOs to database models

## Migration Guide

### Before (Duplicated DTOs)

```
frontend/src/app/shared/dto/task.dto.ts  ❌ Can drift apart
backend/src/modules/sync/domain/dtos/task.dto.ts  ❌ Manually kept in sync
```

### After (Shared Contracts)

```
contracts/src/dto/task.dto.ts  ✅ Single source of truth
  ↓ imported by
frontend  ✅ Type-safe
backend   ✅ Type-safe
e2e tests ✅ Type-safe
```

## Troubleshooting

### "Cannot find module '@brainassistant/contracts'"

1. Ensure `contracts` package is built: `cd contracts && npm run build`
2. Check package is linked in backend/frontend package.json
3. Restart TypeScript server in your IDE

### "Type mismatch" errors after updating

This is a feature, not a bug! TypeScript is telling you where to update your code.

1. Review the contract change
2. Update all highlighted code
3. Test both frontend and backend

## Future Enhancements

- [ ] Add JSON Schema generation for runtime validation
- [ ] Generate OpenAPI/Swagger specs from DTOs
- [ ] Add zod schemas for runtime parsing
- [ ] Publish to npm registry (if going multi-repo)

