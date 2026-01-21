# GastroMap Testing Guide

## Overview

GastroMap uses Vitest as the primary testing framework, with React Testing Library for component tests and Playwright for E2E tests.

## Table of Contents

- [Setup](#setup)
- [Running Tests](#running-tests)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)

---

## Setup

### Installation

All testing dependencies are already installed:

```bash
npm install
```

### Configuration

**Vitest Config**: [`vitest.config.js`](file:///Users/macbookair15/Desktop/Gastromap_gravity/Sourse%20code/gastromap-antigravity/vitest.config.js)

```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

**Test Setup**: [`src/test/setup.js`](file:///Users/macbookair15/Desktop/Gastromap_gravity/Sourse%20code/gastromap-antigravity/src/test/setup.js)

Includes:
- Browser API mocks (matchMedia, IntersectionObserver, ResizeObserver)
- Geolocation mock
- Automatic cleanup after each test

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm test -- src/api/__tests__/supabaseAdapter.test.js
```

### UI Mode

```bash
npm run test:ui
```

---

## Unit Tests

Unit tests focus on testing individual functions and classes in isolation.

### API Adapter Tests

**Location**: `src/api/__tests__/supabaseAdapter.test.js`

**Example**:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { adapter } from '../supabaseAdapter';
import { mockSupabaseClient, resetSupabaseMocks } from '@/test/mocks/supabase';

describe('SupabaseAdapter', () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });

  describe('Entity Operations', () => {
    it('should list all locations', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(
          mockSuccessResponse(mockLocations)
        ),
      });

      const result = await adapter.entities.Location.list();

      expect(result).toEqual(mockLocations);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('locations');
    });
  });
});
```

### Custom Hooks Tests

**Example**:
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminData } from '@/hooks/useAdminData';

describe('useAdminData', () => {
  it('should fetch all admin data', async () => {
    const { result } = renderHook(() => useAdminData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.locations).toBeDefined();
    expect(result.current.users).toBeDefined();
  });
});
```

---

## Integration Tests

Integration tests verify that multiple components work together correctly.

### Component Tests

**Location**: `src/components/admin/__tests__/LocationForm.test.jsx`

**Example**:
```javascript
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testHelpers';
import LocationForm from '../LocationForm';

describe('LocationForm', () => {
  it('should submit form with valid data', async () => {
    const onSuccess = vi.fn();
    
    renderWithProviders(
      <LocationForm onSuccess={onSuccess} onCancel={vi.fn()} />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Restaurant' },
    });
    
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: 'Krakow' },
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(submitButton);

    // Verify
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

## E2E Tests

End-to-end tests verify complete user workflows using Playwright.

### Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Example E2E Test

**Location**: `e2e/admin-workflow.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/admin');
    // Login
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
  });

  test('should create a new location', async ({ page }) => {
    // Navigate to locations tab
    await page.click('text=Locations');
    
    // Click add button
    await page.click('text=Add Location');
    
    // Fill form
    await page.fill('[name="name"]', 'Test Cafe');
    await page.fill('[name="city"]', 'Krakow');
    await page.fill('[name="address"]', 'Test Street 123');
    
    // Submit
    await page.click('button:has-text("Save")');
    
    // Verify success
    await expect(page.locator('text=Location created')).toBeVisible();
  });
});
```

---

## Test Utilities

### `renderWithProviders()`

Renders components with all necessary providers (React Query, Router, etc.).

**Location**: `src/test/utils/testHelpers.js`

**Usage**:
```javascript
const { queryClient } = renderWithProviders(
  <MyComponent />,
  { route: '/admin' }
);
```

### Mock Data

**Location**: `src/test/mocks/supabase.js`

**Available Mocks**:
- `mockSupabaseClient` - Mocked Supabase client
- `mockUser` - Sample user data
- `mockSession` - Sample session data
- `mockLocation` - Sample location data
- `mockLocations` - Array of sample locations

**Usage**:
```javascript
import { mockLocation, mockSuccessResponse } from '@/test/mocks/supabase';

mockSupabaseClient.from.mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(mockSuccessResponse(mockLocation)),
});
```

### Helper Functions

**`createMockFile(name, size, type)`**

Creates a mock file for upload tests.

```javascript
const file = createMockFile('test.csv', 1024, 'text/csv');
```

**`createMockCSV(headers, rows)`**

Creates CSV data for import tests.

```javascript
const csv = createMockCSV(
  ['name', 'city'],
  [['Cafe 1', 'Krakow'], ['Cafe 2', 'Warsaw']]
);
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```javascript
// ✅ Good - tests behavior
it('should show error message when form is invalid', async () => {
  renderWithProviders(<LocationForm />);
  
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  
  expect(screen.getByText(/name is required/i)).toBeInTheDocument();
});

// ❌ Bad - tests implementation
it('should call validateForm function', () => {
  const spy = vi.spyOn(LocationForm, 'validateForm');
  // ...
});
```

### 2. Use Descriptive Test Names

```javascript
// ✅ Good
it('should display error toast when API call fails', () => {});

// ❌ Bad
it('test error', () => {});
```

### 3. Arrange-Act-Assert Pattern

```javascript
it('should create location', async () => {
  // Arrange
  const onSuccess = vi.fn();
  renderWithProviders(<LocationForm onSuccess={onSuccess} />);
  
  // Act
  fireEvent.change(screen.getByLabelText(/name/i), {
    target: { value: 'Test' }
  });
  fireEvent.click(screen.getByRole('button', { name: /save/i }));
  
  // Assert
  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();
  });
});
```

### 4. Clean Up After Tests

```javascript
beforeEach(() => {
  resetSupabaseMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});
```

### 5. Test Edge Cases

```javascript
describe('LocationForm validation', () => {
  it('should handle empty name', () => {});
  it('should handle very long name', () => {});
  it('should handle special characters', () => {});
  it('should handle duplicate locations', () => {});
});
```

### 6. Use waitFor for Async Operations

```javascript
// ✅ Good
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// ❌ Bad - may cause flaky tests
expect(screen.getByText('Success')).toBeInTheDocument();
```

### 7. Mock External Dependencies

```javascript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

---

## Coverage Goals

### Target Coverage

- **Critical Code**: >80%
- **API Layer**: >90%
- **Components**: >70%
- **Utilities**: >85%

### Viewing Coverage

```bash
npm run test:coverage
```

Open `coverage/index.html` in browser to see detailed report.

---

## Continuous Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal"
}
```

### Console Logs

```javascript
it('should do something', () => {
  const result = myFunction();
  console.log('Result:', result); // Will show in test output
  expect(result).toBe(expected);
});
```

### Test Only

Run a single test:

```javascript
it.only('should run only this test', () => {
  // This test will run alone
});
```

Skip a test:

```javascript
it.skip('should skip this test', () => {
  // This test will be skipped
});
```

---

## Common Issues

### "Cannot find module" Error

Ensure path aliases are configured in `vitest.config.js`:

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### "ReferenceError: window is not defined"

Add to test setup:

```javascript
global.window = {};
```

### Flaky Tests

- Use `waitFor` for async operations
- Increase timeout for slow operations
- Reset mocks between tests

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
