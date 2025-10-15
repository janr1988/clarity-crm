# Implementation Guide - Quick Wins

This guide will help you implement the most critical fixes from the improvement recommendations.

## 🚀 Getting Started (30 minutes)

### Step 1: Environment Configuration (5 minutes)

1. **Copy the `.env.example` to `.env`** (if you don't have one already):
```bash
cp .env.example .env
```

2. **Generate a secure NextAuth secret**:
```bash
openssl rand -base64 32
```

3. **Update your `.env` file** with the generated secret:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
```

### Step 2: Update Authentication in API Routes (20 minutes)

The new `api-helpers.ts` and `errors.ts` files are ready to use. Now update your API routes:

#### Example: Fix Tasks API Route

**Before** (`src/app/api/tasks/route.ts`):
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdById, ...rest } = body;

    // For now, use a default user as createdBy
    const defaultUser = await prisma.user.findFirst({
      where: { role: "SALES_LEAD" },
    });

    if (!defaultUser) {
      return NextResponse.json(
        { error: "No sales lead found to create task" },
        { status: 400 }
      );
    }

    const validatedData = createTaskSchema.parse(rest);
    // ...
  } catch (error) {
    // ...
  }
}
```

**After** (with new helpers):
```typescript
import { requireAuth } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(); // ✅ Proper auth
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        createdById: session.user.id, // ✅ Use actual user ID
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error); // ✅ Centralized error handling
  }
}
```

### Step 3: Run Tests (5 minutes)

1. **Run the new test**:
```bash
npm test test/api/tasks.route.test.ts
```

2. **Fix any issues** that come up

---

## 📝 Route-by-Route Update Checklist

Use this checklist to systematically update all your API routes:

### Tasks Routes
- [ ] `src/app/api/tasks/route.ts` - POST method
- [ ] `src/app/api/tasks/route.ts` - GET method (optional, add auth if needed)
- [ ] `src/app/api/tasks/[id]/route.ts` - PATCH method
- [ ] `src/app/api/tasks/[id]/route.ts` - GET method

### Customers Routes
- [ ] `src/app/api/customers/route.ts` - POST method (remove temp-user-id)
- [ ] `src/app/api/customers/route.ts` - GET method
- [ ] `src/app/api/customers/[id]/route.ts` - PATCH method
- [ ] `src/app/api/customers/[id]/route.ts` - GET method

### Activities Routes
- [ ] `src/app/api/activities/route.ts` - POST method
- [ ] `src/app/api/activities/route.ts` - GET method
- [ ] `src/app/api/activities/[id]/route.ts` - PATCH method

### Call Notes Routes
- [ ] `src/app/api/call-notes/route.ts` - POST method
- [ ] `src/app/api/call-notes/route.ts` - GET method
- [ ] `src/app/api/call-notes/[id]/route.ts` - PATCH method

### Other Routes
- [ ] Review all other API routes for consistency

---

## 🧪 Adding Tests for Each Route

For each route you update, add a corresponding test. Use `test/api/tasks.route.test.ts` as a template.

### Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/YOUR_ROUTE/route';
import { NextRequest } from 'next/server';

// Mock authentication
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'SALES_AGENT',
      },
    })
  ),
}));

describe('YOUR_ROUTE API', () => {
  describe('POST', () => {
    it('creates resource with valid data', async () => {
      const data = {
        // your test data
      };

      const request = new NextRequest('http://localhost:3000/api/YOUR_ROUTE', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.id).toBeDefined();
    });

    it('rejects invalid data', async () => {
      const data = {
        // invalid data
      };

      const request = new NextRequest('http://localhost:3000/api/YOUR_ROUTE', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Validation failed');
    });
  });
});
```

---

## 🔐 Common Patterns

### Pattern 1: Public Endpoints (No Auth Required)

```typescript
export async function GET(request: NextRequest) {
  try {
    // No auth required, just fetch data
    const data = await prisma.someModel.findMany();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 2: Authenticated Endpoints

```typescript
import { requireAuth } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    // Use session.user.id for creating resources
    const data = await prisma.someModel.create({
      data: {
        ...body,
        createdById: session.user.id,
      },
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 3: Role-Based Access

```typescript
import { requireRole } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Only SALES_LEAD and MANAGER can delete
    await requireRole(['SALES_LEAD', 'MANAGER']);
    
    await prisma.someModel.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 4: Ownership Check

```typescript
import { requireAuth, requireOwnership } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    // First, get the resource to check ownership
    const resource = await prisma.someModel.findUnique({
      where: { id: params.id },
    });
    
    if (!resource) {
      throw Errors.notFound('Resource');
    }
    
    // Check if user owns it (SALES_LEAD can edit anyone's)
    await requireOwnership(resource.userId, ['SALES_LEAD']);
    
    const body = await request.json();
    const updated = await prisma.someModel.update({
      where: { id: params.id },
      data: body,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Pattern 5: With Foreign Key Validation

```typescript
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createSchema.parse(body);
    
    // Validate all foreign keys before creating
    await validateReferences({
      userId: validatedData.assigneeId,
      customerId: validatedData.customerId,
      companyId: validatedData.companyId,
    });
    
    const data = await prisma.someModel.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 🔄 Migration to Prisma Migrations (Optional but Recommended)

### Current State: Using `db push`
```bash
npm run db:push  # Direct schema sync, no migration history
```

### Recommended: Use migrations

1. **Create initial migration** (one-time):
```bash
npx prisma migrate dev --name init
```

2. **For future schema changes**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_name
```

3. **Update package.json**:
```json
{
  "scripts": {
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}
```

**Benefits:**
- ✅ Version control for schema changes
- ✅ Safe deployments
- ✅ Rollback capability
- ✅ Team collaboration

---

## 📊 Testing Your Changes

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test test/api/tasks.route.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Check Test Coverage
```bash
npm test -- --coverage
```

**Target Coverage:**
- Unit tests: 80%+
- API routes: 70%+
- Components: 60%+

---

## 🎯 Success Criteria

After implementing these changes, you should have:

- [ ] No hardcoded user IDs (`temp-user-id`) in any API route
- [ ] All API routes use `requireAuth()` or similar
- [ ] All API routes use `handleApiError()` for error handling
- [ ] `.env.example` file exists and is documented
- [ ] At least one test file for each API endpoint
- [ ] All tests passing
- [ ] Better error messages in the console and API responses

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" errors after update

**Cause:** Session not being passed correctly

**Fix:**
1. Check that `NEXTAUTH_SECRET` is set in `.env`
2. Restart your dev server: `npm run dev`
3. Clear your browser cookies or try incognito mode

### Issue: Tests failing with database errors

**Cause:** Test database not set up or has conflicts

**Fix:**
```bash
# Reset test database
rm prisma/test.db
npx prisma db push --schema=prisma/schema.prisma
```

### Issue: Foreign key constraint errors

**Cause:** Trying to reference non-existent records

**Fix:**
Use the `validateReferences()` helper before creating records:
```typescript
await validateReferences({
  userId: data.userId,
  customerId: data.customerId,
});
```

---

## 📚 Next Steps

After completing the quick wins:

1. **Week 2**: Add transaction handling for multi-step operations
2. **Week 3**: Implement structured logging
3. **Week 4**: Add monitoring and observability

Refer to `IMPROVEMENT_RECOMMENDATIONS.md` for the complete roadmap.

---

## 💡 Tips

1. **Update one route at a time** - Don't try to update everything at once
2. **Test after each change** - Make sure the route still works
3. **Commit frequently** - Small commits make it easier to roll back if needed
4. **Use the patterns** - The common patterns section has most scenarios covered
5. **Ask for help** - If stuck, refer back to the recommendations document

---

Good luck! 🚀 These changes will significantly improve the reliability and maintainability of your codebase.

