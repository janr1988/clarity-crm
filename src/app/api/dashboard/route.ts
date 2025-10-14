import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const userId = searchParams.get("userId");
    const isLead = searchParams.get("isLead") === "true";

    const dateFilter = start && end ? {
      createdAt: {
        gte: new Date(start),
        lte: new Date(end),
      },
    } : {};

    // Determine if we're looking at upcoming tasks (for planning)
    // Allow for a 5-minute buffer to account for API call timing
    const now = new Date();
    const bufferTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    const isUpcomingView = start && new Date(start) >= bufferTime;
    
    const [users, tasks, activities, callNotes, upcomingTasks] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { tasksAssigned: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
          // Sales Agent only sees their own tasks
          ...(userId && !isLead && { assigneeId: userId }),
          // For upcoming views, filter by dueDate; for past views, filter by createdAt
          ...(isUpcomingView ? {
            dueDate: {
              gte: new Date(start!),
              lte: new Date(end!),
            }
          } : dateFilter),
        },
        include: {
          assignee: true,
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.activity.findMany({
        where: {
          // Sales Agent only sees their own activities
          ...(userId && !isLead && { userId }),
          ...dateFilter,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.callNote.findMany({
        where: {
          // Sales Agent only sees their own call notes
          ...(userId && !isLead && { userId }),
          ...dateFilter,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Get upcoming tasks for Sales Leads (next 7 days)
      isLead ? prisma.task.findMany({
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
        },
        include: {
          assignee: true,
        },
        orderBy: { dueDate: "asc" },
        take: 15,
      }) : Promise.resolve([]),
    ]);

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayActivities = activities.filter(
      (activity) =>
        activity.createdAt >= today && activity.createdAt < tomorrow
    ).length;

    const stats = {
      totalUsers: users.length,
      activeTasks: tasks.length,
      todayActivities,
      totalCalls: callNotes.length,
      upcomingTasks: upcomingTasks.length,
    };

    return NextResponse.json({
      users,
      tasks,
      activities,
      callNotes,
      upcomingTasks,
      stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
