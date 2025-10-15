# Example: Refactored Tasks API Route

This document shows the before and after of refactoring the tasks API route with the new helpers.

## Before (Current Implementation)

**File:** `src/app/api/tasks/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(assigneeId && { assigneeId }),
      ...(status && { status: status as any }),
      ...(teamId && { teamId }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 5 * 60 * 1000);
      const isUpcomingView = startDate >= bufferTime;
      
      if (isUpcomingView) {
        whereClause.dueDate = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdById, ...rest } = body;

    // ❌ PROBLEM: Using a default user as createdBy
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

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
        createdById: createdById || defaultUser.id, // ❌ PROBLEM: Fallback to defaultUser
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    // ❌ PROBLEM: Only handles Zod errors, generic error handling
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
```

## After (Refactored Implementation)

**File:** `src/app/api/tasks/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // ✅ Optional: Add auth if you want to filter by user automatically
    // For now, keeping it public but you could add:
    // const session = await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(assigneeId && { assigneeId }),
      ...(status && { status: status as any }),
      ...(teamId && { teamId }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 5 * 60 * 1000);
      const isUpcomingView = startDate >= bufferTime;
      
      if (isUpcomingView) {
        whereClause.dueDate = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error); // ✅ Centralized error handling
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ FIXED: Require authentication
    const session = await requireAuth();
    
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // ✅ FIXED: Validate foreign keys before creating
    if (validatedData.assigneeId || validatedData.teamId) {
      await validateReferences({
        userId: validatedData.assigneeId,
        teamId: validatedData.teamId,
      });
    }

    // ✅ FIXED: Use actual authenticated user
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assigneeId: validatedData.assigneeId || null,
        teamId: validatedData.teamId || null,
        createdById: session.user.id, // ✅ Use authenticated user
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error); // ✅ Handles all error types
  }
}
```

## Key Changes

### 1. Authentication
**Before:**
```typescript
// Uses a fallback default user
const defaultUser = await prisma.user.findFirst({
  where: { role: "SALES_LEAD" },
});
```

**After:**
```typescript
// Requires proper authentication
const session = await requireAuth();
// ... later ...
createdById: session.user.id
```

### 2. Error Handling
**Before:**
```typescript
catch (error) {
  if (error instanceof ZodError) {
    // ... only handles Zod
  }
  console.error("Error creating task:", error);
  return NextResponse.json(
    { error: "Failed to create task" },
    { status: 500 }
  );
}
```

**After:**
```typescript
catch (error) {
  return handleApiError(error); // Handles all error types
}
```

### 3. Foreign Key Validation
**Before:**
```typescript
// No validation, could cause P2003 Prisma errors
const task = await prisma.task.create({
  data: {
    assigneeId: validatedData.assigneeId,
    // ...
  },
});
```

**After:**
```typescript
// Validates references exist before creating
if (validatedData.assigneeId || validatedData.teamId) {
  await validateReferences({
    userId: validatedData.assigneeId,
    teamId: validatedData.teamId,
  });
}
```

### 4. Response Shape
**Before:**
```typescript
include: {
  assignee: true, // Returns entire user object including password hash
  createdBy: true,
  team: true,
}
```

**After:**
```typescript
include: {
  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true, // Only return what's needed
    },
  },
  // ... same for other relations
}
```

## Error Response Examples

### Before
```json
// Generic error
{
  "error": "Failed to create task"
}
```

### After
```json
// Validation error
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}

// Foreign key error
{
  "error": "Referenced record does not exist",
  "code": "FOREIGN_KEY_CONSTRAINT",
  "details": {
    "field": "assigneeId"
  }
}

// Authentication error
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}

// Not found error
{
  "error": "Task not found",
  "code": "NOT_FOUND"
}
```

## Testing

```typescript
// test/api/tasks.route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/tasks/route';

describe('Tasks API - POST', () => {
  it('creates task with authenticated user', async () => {
    const response = await POST(createRequest({
      title: 'Test Task',
      status: 'TODO',
      priority: 'HIGH',
    }));

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.createdBy.id).toBe('test-user-id');
  });

  it('rejects unauthenticated request', async () => {
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const response = await POST(createRequest({
      title: 'Test Task',
    }));

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  it('validates foreign keys', async () => {
    const response = await POST(createRequest({
      title: 'Test Task',
      assigneeId: 'non-existent-user-id',
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('BAD_REQUEST');
  });
});
```

## Benefits of Refactoring

1. ✅ **Security**: Proper authentication, no hardcoded user IDs
2. ✅ **Reliability**: Foreign key validation prevents constraint errors
3. ✅ **Maintainability**: Centralized error handling, consistent responses
4. ✅ **Debugging**: Better error messages with codes and details
5. ✅ **Testing**: Easier to test with predictable error responses
6. ✅ **Type Safety**: Better TypeScript support with typed helpers
7. ✅ **Performance**: Selective field loading with `select`

## Next Steps

Apply this same pattern to:
1. `src/app/api/customers/route.ts`
2. `src/app/api/activities/route.ts`
3. `src/app/api/call-notes/route.ts`
4. All other API routes

Each route should:
- ✅ Use `requireAuth()` or `requireRole()` where appropriate
- ✅ Use `handleApiError()` for all error handling
- ✅ Validate foreign keys before creating relations
- ✅ Use `select` to limit fields in responses
- ✅ Have corresponding tests

