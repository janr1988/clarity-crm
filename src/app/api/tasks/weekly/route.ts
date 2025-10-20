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
    const teamId = searchParams.get("teamId");
    const weekStart = searchParams.get("weekStart");

    if (!userId && !teamId) {
      return NextResponse.json(
        { error: "User ID or Team ID is required" },
        { status: 400 }
      );
    }

    // Check if user can view this user's tasks (only for real user IDs, not "ALL")
    if (userId && userId !== "ALL" && !canViewUserDetails(session, userId)) {
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

    // Build filters for user or team
    const taskWhere: any = {
      dueDate: { gte: weekStartDate, lte: weekEndDate },
    };
    const callWhere: any = {
      createdAt: { gte: weekStartDate, lte: weekEndDate },
      type: "CALL",
    };

    if (userId && userId !== "ALL") {
      taskWhere.assigneeId = userId;
      callWhere.userId = userId;
    } else if (teamId || userId === "ALL") {
      // Get team members first
      const effectiveTeamId = teamId || session.user.teamId;
      if (!effectiveTeamId) {
        return NextResponse.json(
          { error: "Team ID is required for team queries" },
          { status: 400 }
        );
      }
      
      const teamMembers = await prisma.user.findMany({
        where: { teamId: effectiveTeamId, isActive: true, role: "SALES_AGENT" },
        select: { id: true },
      });
      const memberIds = teamMembers.map(member => member.id);
      taskWhere.assigneeId = { in: memberIds };
      callWhere.userId = { in: memberIds };
    }

    // Get both tasks and calls (activities) for the week
    const [tasks, calls] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        include: {
          assignee: { select: { id: true, name: true, teamId: true } },
        },
        orderBy: { priority: "desc" },
      }),
      prisma.activity.findMany({
        where: callWhere,
        include: {
          user: { select: { id: true, name: true, teamId: true } },
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
      kanbanStatus: task.status, // Use actual task status instead of kanbanStatus
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
      kanbanStatus: "TODO", // Default status for calls
      type: "call" as const,
    }));

    // Combine and return
    const allItems = [...formattedTasks, ...formattedCalls];

    return NextResponse.json(allItems, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("Error fetching weekly tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly tasks" },
      { status: 500 }
    );
  }
}
