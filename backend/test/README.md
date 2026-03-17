# Backend Integration Tests

## Overview

This directory contains integration tests that validate the entire request-response flow from controller through use cases to database persistence.

## Test Structure

```
test/
├── integration/
│   ├── _setup/
│   │   └── mongo-memory.ts          # In-memory MongoDB setup
│   ├── files/
│   │   ├── upload-image.int.spec.ts # File upload tests
│   │   └── test-app.ts              # Test app builder for file operations
│   └── sync/
│       ├── assets/
│       │   └── test-img.jpg         # Test image fixture
│       ├── create-task.int.spec.ts  # Task creation tests
│       └── test-app.ts              # Test app builder for sync operations
└── setup-env.ts                      # Test environment configuration
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- upload-image.int.spec.ts
```

## Test Philosophy

### Integration Testing Approach

- ✅ **Real services**: Uses actual implementations (ImageResizeService, ImageRepoService)
- ✅ **Real database**: In-memory MongoDB for realistic persistence testing
- ✅ **Mocked externals**: External APIs (Google Drive, Slack) are mocked to avoid network calls
- ✅ **Test outcomes**: Focus on behavior and results, not implementation details

### What We Test

**File Upload Tests** (`test/integration/files/upload-image.int.spec.ts`):
- Happy path: Upload image → process → save metadata to DB
- Error handling: Unsupported file types
- Error handling: External service failures

**Task Sync Tests** (`test/integration/sync/create-task.int.spec.ts`):
- Happy path: Create task → persist to DB
- Validation: Required fields

## Environment Configuration

Tests use `setup-env.ts` to configure required environment variables:

```typescript
process.env.FILES_UPLOAD_PATH = './test-uploads';
```

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/backend-tests.yml` for the full CI configuration.

## Writing New Tests

### 1. Create Test App Builder

```typescript
// test/integration/your-feature/test-app.ts
export function buildYourFeatureTestApp() {
  const mockExternalService = {
    someMethod: jest.fn(),
  } as any;

  const yourUseCase = new YourUseCase(realRepoService, mockExternalService);
  const yourController = new YourController(yourUseCase);

  const app = express();
  app.use((req, res, next) => {
    (req as any).user = { _id: 'test-user-1', username: 'test@example.com' };
    next();
  });

  app.post('/api/your-endpoint', async (req, res) => {
    await (yourController as any).execute(req, res);
  });

  return { app, yourController, mockExternalService };
}
```

### 2. Write Integration Test

```typescript
// test/integration/your-feature/your-feature.int.spec.ts
import request from 'supertest';
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from '../_setup/mongo-memory.js';
import { buildYourFeatureTestApp } from './test-app.js';

describe('Integration: YourFeature', () => {
  let app: Express;
  let mockService: any;

  beforeAll(async () => {
    await startInMemoryMongo();
    const built = buildYourFeatureTestApp();
    app = built.app;
    mockService = built.mockExternalService;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    mockService.someMethod.mockResolvedValue('result');

    const res = await request(app)
      .post('/api/your-endpoint')
      .send({ data: 'test' });

    expect(res.status).toBe(200);
    // Assert on outcomes, not implementation
  });
});
```

## Best Practices

1. **Focus on outcomes** - Test what the system does, not how it does it
2. **Use real services** - Only mock external dependencies (APIs, network calls)
3. **Clean up** - Use `afterAll` and `beforeEach` for proper test isolation
4. **Test fixtures** - Use committed fixtures, create temporary files in gitignored directories
5. **Descriptive names** - Test names should describe the behavior being tested

## Troubleshooting

### Test fails with "Missing required env variable"
- Ensure `setup-env.ts` is configured in `jest.config.ts`
- Check that all required env vars are set in `setup-env.ts`

### MongoDB connection issues
- Ensure MongoDB Memory Server is properly started in `beforeAll`
- Check timeout settings (default 30s should be enough)

### File upload tests failing
- Verify test image exists at `test/integration/sync/assets/test-img.jpg`
- Check that upload directories are gitignored and cleaned up properly

