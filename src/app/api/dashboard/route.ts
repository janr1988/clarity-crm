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

    const [users, tasks, activities, callNotes] = await Promise.all([
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
          ...dateFilter,
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
    };

    return NextResponse.json({
      users,
      tasks,
      activities,
      callNotes,
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
