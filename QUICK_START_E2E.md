# 🚀 Quick Start - E2E Testing

## ⚡ Run Your First E2E Test (2 minutes)

### Step 1: Update Test Credentials (IMPORTANT!)

Open `e2e/fixtures.ts` and update the user IDs to match your database:

```typescript
export const TEST_USERS = {
  salesLead: {
    email: 'lead@clarity.com',
    password: 'password123',
    id: '0136cad8-2200-46cc-9186-7c65154f7797', // ← Update this!
  },
  salesAgent1: {
    email: 'agent1@clarity.com',
    password: 'password123',
    id: '76cc95df-6794-47f6-9533-63127b586c17', // ← Update this!
  },
  salesAgent2: {
    email: 'agent2@clarity.com',
    password: 'password123',
    id: '6fd29fee-a891-48ba-941d-8fe702132886', // ← Update this!
  },
};
```

**How to find your user IDs:**
```bash
# Option 1: Using Prisma Studio
npm run db:studio
# Navigate to User table and copy the IDs

# Option 2: Using SQLite
sqlite3 prisma/dev.db "SELECT id, email, role FROM User;"
```

### Step 2: Run Tests in Interactive Mode

```bash
npm run test:e2e:ui
```

This opens Playwright's UI where you can:
- ✅ See all 17 tests
- ✅ Run individual tests
- ✅ Watch tests execute
- ✅ See screenshots and traces

### Step 3: Watch It Work! 🎬

The tests will:
1. **Backup** your database
2. **Run** the test
3. **Restore** your database
4. **Show** you the results

**Your dummy data is SAFE!** ✅

---

## 🎯 What Each Test Does

### Task Creation (3 tests) - ~15 seconds
- Creates a test task
- Validates forms work
- Ensures no duplicates

### Customer Management (3 tests) - ~15 seconds  
- Creates test customer
- Checks email uniqueness
- Verifies list display

### Deal Workflow (3 tests) - ~20 seconds
- Creates test deal
- Adds notes
- Closes deal (won/lost)

### Task Reassignment (3 tests) - ~15 seconds
- Reassigns task between users
- Verifies ownership changes
- Maintains data integrity

### Data Integrity (5 tests) - ~25 seconds
- Tests deletion safety
- Checks for orphaned records
- Verifies cascade deletes

**Total: ~90 seconds for all 17 tests**

---

## 📝 Common Commands

```bash
# Interactive UI (best for first time)
npm run test:e2e:ui

# Run all tests (headless)
npm run test:e2e

# Debug a specific test
npm run test:e2e:debug

# See browser while testing
npm run test:e2e:headed

# View last test report
npm run test:e2e:report
```

---

## ✅ Expected Output

When tests pass, you'll see:

```
Running 17 tests using 1 worker

  ✓ [chromium] › 01-task-creation.spec.ts:3:5 › Critical Flow: Task Creation › should create a task without affecting existing data (5s)
  ✓ [chromium] › 01-task-creation.spec.ts:4:5 › Critical Flow: Task Creation › should handle validation errors gracefully (3s)
  ...
  ✓ [chromium] › 05-data-integrity.spec.ts:5:5 › Critical Flow: Data Integrity & Deletion › should maintain database consistency (4s)

  17 passed (1.8m)
```

---

## 🐛 Troubleshooting

### "Browser not found"
```bash
npx playwright install chromium
```

### Tests fail on first run?
1. Check test credentials in `e2e/fixtures.ts`
2. Make sure dev server is running
3. Try running in UI mode: `npm run test:e2e:ui`

### Database not restored?
```bash
npm run db:restore:latest
```

---

## 📖 Full Documentation

For complete details, see:
- **`E2E_TESTING_GUIDE.md`** - Complete guide
- **`E2E_TESTS_SUMMARY.md`** - What was implemented
- **`e2e/README.md`** - Quick reference

---

## 🎉 You're Ready!

Run this now:
```bash
npm run test:e2e:ui
```

Watch your tests protect your data! 🛡️

