import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(userId && { userId }),
      ...(type && { type: type as any }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      whereClause.createdAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    // Fetch activities, call notes, and tasks
    const [activities, callNotes, tasks] = await Promise.all([
      prisma.activity.findMany({
        where: whereClause,
        include: {
          user: true,
          customer: true,
          company: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.callNote.findMany({
        where: {
          ...(userId && { userId }),
          ...(start && end && {
            createdAt: {
              gte: new Date(start),
              lte: new Date(end),
            },
          }),
        },
        include: {
          user: true,
          customer: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: {
          ...(userId && { assigneeId: userId }),
          ...(start && end && (() => {
            const startDate = new Date(start);
            const endDate = new Date(end);
            // Allow for a 5-minute buffer to account for API call timing
            const now = new Date();
            const bufferTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
            const isUpcomingView = startDate >= bufferTime;
            
            return isUpcomingView ? {
              dueDate: {
                gte: startDate,
                lte: endDate,
              }
            } : {
              createdAt: {
                gte: startDate,
                lte: endDate,
              }
            };
          })()),
        },
        include: {
          assignee: true,
          customer: true,
          company: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Transform call notes and tasks to match activity format
    const transformedCallNotes = callNotes.map(call => ({
      id: call.id,
      type: "CALL",
      title: `Call with ${call.clientName}`,
      description: call.notes,
      duration: null, // CallNote doesn't have duration field
      userId: call.userId,
      user: call.user,
      customerId: call.customerId,
      customer: call.customer,
      companyId: null,
      company: null,
      createdAt: call.createdAt,
      updatedAt: call.updatedAt,
      _source: "callNote" as const,
    }));

    const transformedTasks = tasks.map(task => ({
      id: task.id,
      type: task.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK",
      title: task.title,
      description: task.description,
      duration: task.actualDuration || task.estimatedDuration,
      userId: task.assigneeId,
      user: task.assignee,
      customerId: task.customerId,
      customer: task.customer,
      companyId: task.companyId,
      company: task.company,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      _source: "task" as const,
    }));

    // Combine all activities and sort by date
    const allActivities = [
      ...activities.map(a => ({ ...a, _source: "activity" as const })),
      ...transformedCallNotes,
      ...transformedTasks,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allActivities);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    // Validate foreign keys if provided
    await validateReferences({
      userId: validatedData.userId,
      customerId: body.customerId,
      companyId: body.companyId,
    });

    const activity = await prisma.activity.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        duration: validatedData.duration,
        userId: validatedData.userId,
        customerId: body.customerId || null,
        companyId: body.companyId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

