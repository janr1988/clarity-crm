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
      
      // Determine if this is an upcoming view (future dates or very recent past)
      // Allow for a 5-minute buffer to account for API call timing
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      const isUpcomingView = startDate >= bufferTime;
      
      if (isUpcomingView) {
        // For upcoming views, filter by dueDate
        whereClause.dueDate = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        // For past views, filter by createdAt
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

    // For now, use a default user as createdBy
    // In production, get this from session/auth
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
        createdById: createdById || defaultUser.id,
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
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
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

