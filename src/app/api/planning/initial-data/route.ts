import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getTeamCapacityInfo, getWeekStart } from "@/lib/capacityUtils";

/**
 * Unified Planning API Endpoint
 * Fetches all planning page data in a single request to reduce latency
 * Returns: team members, capacity data, and weekly tasks
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");
    const weekParam = searchParams.get("weekStart");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

  // Parse week start date and normalize to Monday of that week
  let weekStartDate: Date;
  if (weekParam && weekParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = weekParam.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    // Normalize to the Monday of that week
    weekStartDate = getWeekStart(parsedDate);
  } else {
    weekStartDate = getWeekStart();
  }

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);
    weekEndDate.setHours(23, 59, 59, 999);

    // Fetch all data in parallel
    const [teamMembers, capacityData, tasks, calls] = await Promise.all([
      // 1. Get team members
      prisma.user.findMany({
        where: {
          teamId: teamId,
          isActive: true,
          role: "SALES_AGENT",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: "asc" },
      }),

      // 2. Get team capacity info
      getTeamCapacityInfo(teamId, weekStartDate),

      // 3. Get weekly tasks
      prisma.task.findMany({
        where: {
          dueDate: { gte: weekStartDate, lte: weekEndDate },
          assignee: {
            teamId: teamId,
            isActive: true,
            role: "SALES_AGENT",
          },
        },
        include: {
          assignee: { select: { id: true, name: true, teamId: true } },
        },
        orderBy: { priority: "desc" },
      }),

      // 4. Get weekly calls (activities)
      prisma.activity.findMany({
        where: {
          createdAt: { gte: weekStartDate, lte: weekEndDate },
          type: "CALL",
          user: {
            teamId: teamId,
            isActive: true,
            role: "SALES_AGENT",
          },
        },
        include: {
          user: { select: { id: true, name: true, teamId: true } },
        },
      }),
    ]);

    // Add "All Team Members" option for Sales Leads
    const membersWithOptions = isSalesLead(session)
      ? [
          { id: "ALL", name: "All Team Members", email: "", role: "" },
          { id: session.user.id, name: session.user.name || "Me (Current User)", email: "", role: session.user.role || "" },
          ...teamMembers.filter(m => m.id !== session.user.id),
        ]
      : teamMembers;

    // Format tasks
    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      estimatedDuration: task.estimatedDuration,
      priority: task.priority,
      kanbanStatus: task.status,
      type: "task" as const,
    }));

    // Format calls as task items
    const formattedCalls = calls.map((call) => ({
      id: call.id,
      title: call.title,
      description: call.description,
      assignee: call.user,
      estimatedDuration: call.estimatedDuration || call.duration,
      priority: "MEDIUM",
      kanbanStatus: "TODO",
      type: "call" as const,
    }));

    const allItems = [...formattedTasks, ...formattedCalls];

    // Return unified response
    const response = {
      teamMembers: membersWithOptions,
      capacity: {
        weekStart: capacityData.weekStart.toISOString(),
        weekEnd: capacityData.weekEnd.toISOString(),
        teamCapacity: capacityData.teamCapacity,
        totalTeamCapacity: capacityData.totalTeamCapacity,
        totalTeamUsage: capacityData.totalTeamUsage,
        teamCapacityPercentage: capacityData.teamCapacityPercentage,
      },
      weeklyTasks: allItems,
      weekStart: weekStartDate.toISOString().split('T')[0],
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error("Error fetching planning initial data:", error);
    return NextResponse.json(
      { error: "Failed to fetch planning data" },
      { status: 500 }
    );
  }
}

