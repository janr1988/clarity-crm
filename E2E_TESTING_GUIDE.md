# E2E Testing Guide - Clarity CRM

## 🎯 Overview

This guide covers the Playwright E2E tests implemented for Clarity CRM. These tests protect your dummy data while ensuring critical functionality works correctly.

---

## 📁 Test Structure

```
e2e/
├── fixtures.ts                      # Shared test utilities and fixtures
├── 01-task-creation.spec.ts         # Task CRUD operations
├── 02-customer-management.spec.ts   # Customer management flows
├── 03-deal-workflow.spec.ts         # Deal creation and workflow
├── 04-task-reassignment.spec.ts     # Task ownership changes
└── 05-data-integrity.spec.ts        # Deletion and data integrity
```

---

## 🚀 Quick Start

### 1. Run All E2E Tests
```bash
npm run test:e2e
```

### 2. Run Tests with UI (Interactive Mode)
```bash
npm run test:e2e:ui
```

### 3. Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### 4. Run Tests with Browser Visible
```bash
npm run test:e2e:headed
```

### 5. View Last Test Report
```bash
npm run test:e2e:report
```

### 6. Run All Tests (Unit + E2E)
```bash
npm run test:all
```

---

## 🧪 Test Coverage

### Critical Flow #1: Task Creation
**File:** `01-task-creation.spec.ts`

**Tests:**
- ✅ Create task without affecting existing data
- ✅ Handle validation errors gracefully
- ✅ Edit existing task

**What it protects:**
- Task creation doesn't create duplicates
- Validation prevents bad data
- Updates work correctly

---

### Critical Flow #2: Customer Management
**File:** `02-customer-management.spec.ts`

**Tests:**
- ✅ Create customer and assign to user
- ✅ Prevent duplicate customer emails
- ✅ Display customer details correctly

**What it protects:**
- Customer data integrity
- Email uniqueness
- User assignment relationships

---

### Critical Flow #3: Deal Workflow
**File:** `03-deal-workflow.spec.ts`

**Tests:**
- ✅ Create deal, add notes, close as won
- ✅ Close deal as lost with reason
- ✅ Display deals in list

**What it protects:**
- Deal lifecycle management
- Deal-customer relationships
- Status transitions

---

### Critical Flow #4: Task Reassignment
**File:** `04-task-reassignment.spec.ts`

**Tests:**
- ✅ Reassign task from one user to another
- ✅ Handle unassigning a task
- ✅ Maintain task data during reassignment

**What it protects:**
- Task ownership changes
- Task data integrity during reassignment
- User-task relationships

---

### Critical Flow #5: Data Integrity & Deletion
**File:** `05-data-integrity.spec.ts`

**Tests:**
- ✅ Handle customer deletion without corrupting data
- ✅ Verify no orphaned tasks after user operations
- ✅ Verify no orphaned customers after company operations
- ✅ Handle task deletion without affecting other tasks
- ✅ Maintain database consistency after multiple operations

**What it protects:**
- Cascade deletes work correctly
- No orphaned records
- Foreign key integrity
- Database consistency

---

## 🛡️ Dummy Data Protection

### Automatic Database Backup

Every test automatically:
1. **Backs up** your database before running
2. **Runs** the test
3. **Restores** the database after completion

**Location:** `prisma/e2e-backup.db` (temporary, cleaned up after tests)

### How It Works

The `dbBackup` fixture in `fixtures.ts` handles this automatically:

```typescript
dbBackup: [async ({}, use) => {
  await dbHelpers.backup();    // Before test
  await use();                  // Run test
  await dbHelpers.restore();    // After test
}, { auto: true }]
```

### Manual Backup/Restore

If needed, you can manually backup/restore:

```typescript
import { dbHelpers } from './fixtures';

// Backup
await dbHelpers.backup();

// Restore
await dbHelpers.restore();

// Cleanup backup file
await dbHelpers.cleanup();
```

---

## 🔐 Test Credentials

Test users from your seed data (update in `fixtures.ts` if needed):

```typescript
export const TEST_USERS = {
  salesLead: {
    email: 'lead@clarity.com',
    password: 'password123',
    id: '0136cad8-2200-46cc-9186-7c65154f7797',
  },
  salesAgent1: {
    email: 'agent1@clarity.com',
    password: 'password123',
    id: '76cc95df-6794-47f6-9533-63127b586c17',
  },
  salesAgent2: {
    email: 'agent2@clarity.com',
    password: 'password123',
    id: '6fd29fee-a891-48ba-941d-8fe702132886',
  },
};
```

**⚠️ Important:** Update these IDs to match your actual database!

---

## 📊 Test Execution Flow

### Sequential Execution (Default)

Tests run one at a time to prevent data conflicts:

```typescript
// playwright.config.ts
fullyParallel: false,  // Sequential
workers: 1,            // Single worker
```

### Why Sequential?

- **Data Safety:** Prevents race conditions
- **Predictability:** Tests don't interfere with each other
- **Debugging:** Easier to trace issues

---

## 🎨 Test Fixtures

### `authenticatedPage`
Pre-authenticated page as a sales agent.

```typescript
test('my test', async ({ authenticatedPage }) => {
  const page = authenticatedPage;
  // Already logged in as agent1
  await page.goto('/tasks');
});
```

### `salesLeadPage`
Pre-authenticated page as a sales lead (manager).

```typescript
test('my test', async ({ salesLeadPage }) => {
  const page = salesLeadPage;
  // Already logged in as sales lead
  await page.goto('/users');
});
```

### Helper Functions

**`generateTestData()`** - Generate unique test data:
```typescript
const { unique, timestamp, random } = generateTestData();
const taskTitle = `Test Task ${unique}`;
```

**`waitForApiResponse()`** - Wait for specific API calls:
```typescript
const responsePromise = waitForApiResponse(page, '/api/tasks');
await page.click('button[type="submit"]');
const response = await responsePromise;
```

---

## 🐛 Debugging Tests

### 1. Run Single Test File
```bash
npx playwright test e2e/01-task-creation.spec.ts
```

### 2. Run Single Test
```bash
npx playwright test -g "should create a task"
```

### 3. Debug Mode (Step Through)
```bash
npm run test:e2e:debug
```

### 4. View Test with Browser
```bash
npm run test:e2e:headed
```

### 5. Check Test Report
```bash
npm run test:e2e:report
```

### 6. View Trace (After Failure)
```bash
npx playwright show-trace playwright-report/trace.zip
```

---

## 📝 Writing New Tests

### Template

```typescript
import { test, expect, generateTestData } from './fixtures';

test.describe('My Feature Tests', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const testData = generateTestData();
    
    // 1. Setup - Get initial state
    const beforeResponse = await page.request.get('/api/endpoint');
    const beforeData = await beforeResponse.json();
    
    // 2. Action - Perform operation
    await page.goto('/my-page');
    await page.fill('input[name="field"]', `Value ${testData.unique}`);
    await page.click('button[type="submit"]');
    
    // 3. Wait for completion
    await page.waitForTimeout(1000);
    
    // 4. Assert - Verify result
    const afterResponse = await page.request.get('/api/endpoint');
    const afterData = await afterResponse.json();
    expect(afterData.length).toBe(beforeData.length + 1);
    
    console.log('✓ Test passed');
  });
});
```

### Best Practices

1. **Always use unique data**
   ```typescript
   const testData = generateTestData();
   const name = `Test ${testData.unique}`;
   ```

2. **Check before and after state**
   ```typescript
   const before = await page.request.get('/api/items');
   // ... do action ...
   const after = await page.request.get('/api/items');
   ```

3. **Use explicit waits**
   ```typescript
   await page.waitForTimeout(1000);  // For network
   await page.waitForLoadState('networkidle');  // For page load
   ```

4. **Handle missing UI elements gracefully**
   ```typescript
   const button = page.locator('button').first();
   if (await button.count() > 0) {
     await button.click();
   }
   ```

5. **Add console logs**
   ```typescript
   console.log('✓ Step completed');
   console.log(`Created ${items.length} items`);
   ```

---

## 🚨 Common Issues & Solutions

### Issue: "Browser not found"
**Solution:**
```bash
npx playwright install chromium
```

### Issue: "Test timeout"
**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
timeout: 90000,  // 90 seconds
```

### Issue: "Database not restored"
**Solution:** Run cleanup manually:
```bash
npm run db:restore:latest
```

### Issue: "Element not found"
**Solution:** Use flexible selectors:
```typescript
// Try multiple selectors
const input = page.locator('input[name="title"], #title, input[placeholder*="Title"]').first();
```

### Issue: "Authentication failed"
**Solution:** Check test credentials in `fixtures.ts` match your database.

---

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎯 Test Maintenance

### Update Test Credentials

When your seed data changes, update `e2e/fixtures.ts`:

```typescript
export const TEST_USERS = {
  salesLead: {
    email: 'new-email@test.com',
    password: 'new-password',
    id: 'new-user-id',  // ← Update this
  },
};
```

### Add New Tests

1. Create new spec file: `e2e/06-my-feature.spec.ts`
2. Import fixtures: `import { test, expect } from './fixtures'`
3. Write tests following the template
4. Run: `npx playwright test e2e/06-my-feature.spec.ts`

### Update Selectors

If UI changes break tests, update selectors:

```typescript
// Old
await page.click('button.submit');

// New - more flexible
await page.click('button[type="submit"], button:has-text("Submit")');
```

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

---

## ✅ Success Metrics

After running E2E tests, you should see:

```
Test Files  5 passed (5)
     Tests  18 passed (18)
  Start at  XX:XX:XX
  Duration  XXs

✓ All critical flows tested
✓ Database integrity maintained
✓ No data corruption
✓ All assertions passed
```

---

## 💡 Tips

1. **Run tests before pushing code**
   ```bash
   npm run test:all
   ```

2. **Use UI mode for developing tests**
   ```bash
   npm run test:e2e:ui
   ```

3. **Check reports after failures**
   ```bash
   npm run test:e2e:report
   ```

4. **Keep tests fast** - Tests run in ~2-3 minutes total

5. **Update regularly** - Keep selectors in sync with UI changes

---

## 🤝 Contributing

When adding new features:

1. ✅ Add E2E test covering the feature
2. ✅ Ensure test uses unique data (generateTestData)
3. ✅ Verify database backup/restore works
4. ✅ Test locally before committing
5. ✅ Update this guide if needed

---

**Happy Testing! 🎉**

Your dummy data is now protected by comprehensive E2E tests!

