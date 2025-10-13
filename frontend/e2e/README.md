# Frontend E2E Tests

## Overview

This directory contains end-to-end (E2E) tests using Playwright that validate the entire user journey from UI interactions to expected outcomes. Tests run against a real browser with mocked backend responses.

## Test Structure

```
e2e/
├── assets/
│   └── test-img.jpg              # Test image fixture for upload tests
├── stubs/
│   ├── task-stubs.ts             # Mock task data
│   └── user-stubs.ts             # Mock user data
├── utils/
│   └── test-helpers.ts           # Reusable test utilities
└── create-task.spec.ts           # Task creation E2E tests
```

## Running Tests

```bash
# Install dependencies (first time only)
npm install
npx playwright install --with-deps

# Run all E2E tests
npm run e2e

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test create-task.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Philosophy

### E2E Testing Approach

- ✅ **User-centric**: Tests simulate real user interactions (clicks, typing, navigation)
- ✅ **Mocked backend**: Uses stubbed responses to avoid network dependency
- ✅ **Visual validation**: Checks for visible elements, not internal state
- ✅ **Isolated tests**: Each test is independent and can run in any order

### What We Test

**Task Creation Tests** (`create-task.spec.ts`):
- Happy path: Create task → verify it appears in the list
- Form validation: Required fields, error messages
- Image upload: Attach image → verify preview
- User interactions: Clicks, typing, navigation

## Test Patterns

### 1. Page Object Model (Recommended)

```typescript
// pages/task-page.ts
export class TaskPage {
  constructor(private page: Page) {}

  async navigateToTasks() {
    await this.page.goto('/tasks');
  }

  async createTask(title: string) {
    await this.page.fill('[data-testid="task-title"]', title);
    await this.page.click('[data-testid="create-task-btn"]');
  }

  async getTaskByTitle(title: string) {
    return this.page.locator(`[data-testid="task-item"]:has-text("${title}")`);
  }
}

// create-task.spec.ts
import { TaskPage } from './pages/task-page';

test('should create a task', async ({ page }) => {
  const taskPage = new TaskPage(page);
  
  await taskPage.navigateToTasks();
  await taskPage.createTask('My new task');
  
  await expect(taskPage.getTaskByTitle('My new task')).toBeVisible();
});
```

### 2. Mock API Responses

```typescript
test('should handle API errors gracefully', async ({ page }) => {
  // Mock API failure
  await page.route('**/api/tasks', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Server error' }),
    });
  });

  await page.goto('/tasks');
  await page.fill('[data-testid="task-title"]', 'Test task');
  await page.click('[data-testid="create-task-btn"]');

  // Verify error message is displayed
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to create task');
});
```

### 3. File Uploads

```typescript
test('should upload an image', async ({ page }) => {
  await page.goto('/tasks/new');
  
  // Upload test image
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./e2e/assets/test-img.jpg');
  
  // Verify preview appears
  await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
});
```

### 4. Mobile Testing

```typescript
test.use({ 
  viewport: { width: 375, height: 667 },  // iPhone SE
  isMobile: true 
});

test('should work on mobile', async ({ page }) => {
  await page.goto('/tasks');
  
  // Mobile-specific interactions
  await page.tap('[data-testid="menu-btn"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
});
```

## Best Practices

### 1. Use Data Test IDs

```html
<!-- Good: Stable selector -->
<button data-testid="create-task-btn">Create</button>

<!-- Bad: Fragile selector -->
<button class="btn btn-primary mt-3">Create</button>
```

```typescript
// Test
await page.click('[data-testid="create-task-btn"]');  // ✅ Stable
await page.click('.btn.btn-primary.mt-3');           // ❌ Fragile
```

### 2. Wait for Elements Properly

```typescript
// ✅ Good: Auto-waiting
await expect(page.locator('[data-testid="task-item"]')).toBeVisible();

// ❌ Bad: Manual timeout
await page.waitForTimeout(3000);
```

### 3. Clean Test Data

```typescript
test.beforeEach(async ({ page }) => {
  // Clear local storage/cookies before each test
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
});
```

### 4. Descriptive Test Names

```typescript
// ✅ Good: Clear and specific
test('should display error when task title is empty', async ({ page }) => {
  // ...
});

// ❌ Bad: Vague
test('task validation', async ({ page }) => {
  // ...
});
```

## Writing New Tests

### 1. Create Test File

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to page, mock APIs, etc.
    await page.goto('/my-feature');
  });

  test('should do something', async ({ page }) => {
    // Act: User interactions
    await page.click('[data-testid="action-btn"]');
    
    // Assert: Verify outcome
    await expect(page.locator('[data-testid="result"]'))
      .toContainText('Expected result');
  });
});
```

### 2. Add Test Stubs (if needed)

```typescript
// e2e/stubs/my-feature-stubs.ts
export const mockFeatureData = {
  id: '123',
  name: 'Test Feature',
  enabled: true,
};
```

### 3. Add Test Helpers (if needed)

```typescript
// e2e/utils/my-helpers.ts
import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('/dashboard');
}
```

## CI/CD Integration

Tests run automatically in CI via `.github/workflows/frontend-tests.yml`:

- Runs on push/PR to `main` or `develop` branches
- Only triggers when frontend code changes
- Uploads test reports as artifacts
- Retention: 30 days

### View Test Results

1. **Locally**: `npx playwright show-report`
2. **CI**: Download artifacts from GitHub Actions run

## Debugging Failed Tests

### 1. Run in Headed Mode

```bash
npx playwright test --headed
```

### 2. Use Debug Mode

```bash
npx playwright test --debug
```

### 3. Screenshot on Failure

```typescript
test('my test', async ({ page }) => {
  // Playwright auto-captures screenshots on failure
  // Manual screenshot:
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

### 4. Inspect with Playwright Inspector

```bash
npx playwright test --debug create-task.spec.ts
```

### 5. View Trace

```typescript
// playwright.config.js
use: {
  trace: 'on-first-retry',  // Capture trace on first retry
}
```

```bash
# View trace
npx playwright show-trace trace.zip
```

## Configuration

### Browser Configuration

Edit `playwright.config.js`:

```javascript
export default {
  // Run tests in parallel
  workers: process.env.CI ? 1 : 4,
  
  // Timeout
  timeout: 30000,
  
  // Browsers to test
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
};
```

## Troubleshooting

### Tests fail locally but pass in CI
- Check for timing issues (use Playwright's auto-waiting)
- Verify browser versions match
- Check for environment-specific configurations

### Flaky tests
- Add proper waits using `expect().toBeVisible()`
- Avoid `waitForTimeout()` - use deterministic waits
- Check for race conditions in animations/transitions

### Slow tests
- Run fewer browser projects locally
- Use `test.only()` to run specific tests during development
- Consider splitting large test files

### Element not found
- Verify selector with Playwright Inspector
- Check if element is in shadow DOM or iframe
- Ensure element is visible (not hidden by CSS)

## Common Selectors

```typescript
// By data-testid (recommended)
page.locator('[data-testid="task-title"]')

// By role (accessible)
page.getByRole('button', { name: 'Create' })
page.getByRole('textbox', { name: 'Task title' })

// By text
page.getByText('My Task')

// By placeholder
page.getByPlaceholder('Enter task title')

// By label
page.getByLabel('Task title')
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles/)

