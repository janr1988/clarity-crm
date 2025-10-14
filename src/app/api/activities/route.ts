import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validation";
import { ZodError } from "zod";

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
          ...(start && end && {
            createdAt: {
              gte: new Date(start),
              lte: new Date(end),
            },
          }),
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
      duration: call.duration,
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
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    const activity = await prisma.activity.create({
      data: validatedData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
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
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

