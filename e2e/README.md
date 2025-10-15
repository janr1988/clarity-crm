# E2E Tests - Quick Reference

## 🚀 Quick Commands

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Debug mode (step through tests)
npm run test:e2e:debug

# View browser while testing
npm run test:e2e:headed

# View last test report
npm run test:e2e:report

# Run all tests (unit + E2E)
npm run test:all
```

## 📁 Test Files

| File | Purpose | Tests |
|------|---------|-------|
| `01-task-creation.spec.ts` | Task CRUD | 3 tests |
| `02-customer-management.spec.ts` | Customer management | 3 tests |
| `03-deal-workflow.spec.ts` | Deal lifecycle | 3 tests |
| `04-task-reassignment.spec.ts` | Task ownership | 3 tests |
| `05-data-integrity.spec.ts` | Deletion & integrity | 5 tests |
| `fixtures.ts` | Shared utilities | - |

**Total: 17 E2E tests covering all critical flows**

## 🛡️ Data Protection

✅ **Automatic database backup before each test**  
✅ **Automatic restore after each test**  
✅ **Your dummy data is safe!**

## 🔐 Test Users

Update in `fixtures.ts` if your seed data changes:

- **Sales Lead:** `lead@clarity.com` / `password123`
- **Agent 1:** `agent1@clarity.com` / `password123`
- **Agent 2:** `agent2@clarity.com` / `password123`

## 📖 Full Documentation

See `E2E_TESTING_GUIDE.md` for complete documentation.

## 🐛 Troubleshooting

**Tests failing?**
1. Check if dev server is running
2. Verify test credentials in `fixtures.ts`
3. Run in debug mode: `npm run test:e2e:debug`

**Browser not found?**
```bash
npx playwright install chromium
```

**Need help?**
- Check `E2E_TESTING_GUIDE.md`
- View test report: `npm run test:e2e:report`
- Check traces in `playwright-report/`

