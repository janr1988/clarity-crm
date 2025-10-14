import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewUserDetails } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const weekStart = searchParams.get("weekStart");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user can view this user's tasks
    if (!canViewUserDetails(session, userId)) {
      return NextResponse.json(
        { error: "Forbidden: Cannot view this user's tasks" },
        { status: 403 }
      );
    }

    const weekStartDate = weekStart ? new Date(weekStart) : new Date();
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get both tasks and calls (activities) for the week
    const [tasks, calls] = await Promise.all([
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          plannedWeek: {
            gte: weekStartDate,
            lte: weekEndDate,
          },
          isPlanned: true,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          priority: "desc",
        },
      }),
      prisma.activity.findMany({
        where: {
          userId: userId,
          plannedWeek: {
            gte: weekStartDate,
            lte: weekEndDate,
          },
          isPlanned: true,
          type: "CALL",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    // Format tasks
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      estimatedDuration: task.estimatedDuration,
      priority: task.priority,
      kanbanStatus: task.kanbanStatus,
      type: "task" as const,
    }));

    // Format calls as task items
    const formattedCalls = calls.map((call) => ({
      id: call.id,
      title: call.title,
      description: call.description,
      assignee: call.user,
      estimatedDuration: call.estimatedDuration || call.duration,
      priority: "MEDIUM", // Default priority for calls
      kanbanStatus: call.kanbanStatus,
      type: "call" as const,
    }));

    // Combine and return
    const allItems = [...formattedTasks, ...formattedCalls];

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Error fetching weekly tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly tasks" },
      { status: 500 }
    );
  }
}
