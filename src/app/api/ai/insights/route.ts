import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Gather team data
    const [users, tasks, activities, callNotes] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              tasksAssigned: true,
              activities: true,
              callNotes: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        include: {
          assignee: true,
        },
      }),
      prisma.activity.findMany({
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.callNote.findMany({
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    // Calculate performance metrics
    const userMetrics = users.map((user) => {
      const userTasks = tasks.filter((t) => t.assigneeId === user.id);
      const completedTasks = userTasks.filter((t) => t.status === "COMPLETED").length;
      const activeTasks = userTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "TODO").length;
      const completionRate = userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0;
      
      const userActivities = activities.filter((a) => a.userId === user.id);
      const userCalls = callNotes.filter((c) => c.userId === user.id);
      
      const recentActivitiesCount = userActivities.filter(
        (a) => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      return {
        user,
        completedTasks,
        activeTasks,
        completionRate: Math.round(completionRate),
        totalActivities: userActivities.length,
        totalCalls: userCalls.length,
        recentActivitiesCount,
        capacity: activeTasks < 5 ? "low" : activeTasks < 8 ? "medium" : "high",
      };
    });

    // Generate insights
    const topPerformer = userMetrics.reduce((max, current) =>
      current.completionRate > max.completionRate ? current : max
    );

    const underutilized = userMetrics.filter((m) => m.capacity === "low");
    const overloaded = userMetrics.filter((m) => m.capacity === "high");

    const avgCompletionRate =
      userMetrics.reduce((sum, m) => sum + m.completionRate, 0) / userMetrics.length;

    const recentCallsCount = callNotes.filter(
      (c) => new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const upcomingFollowUps = callNotes.filter(
      (c) => c.followUpDate && new Date(c.followUpDate) > new Date()
    ).length;

    // AI-powered insights (simulated - in production, use OpenAI/Anthropic)
    const insights = {
      summary: `Team is performing at ${Math.round(avgCompletionRate)}% task completion rate with ${recentCallsCount} calls logged this week.`,
      
      strengths: [
        `${topPerformer.user.name} is the top performer with ${topPerformer.completionRate}% completion rate`,
        `${recentCallsCount} calls logged in the past week shows strong customer engagement`,
        `${upcomingFollowUps} scheduled follow-ups demonstrate proactive pipeline management`,
      ],

      concerns: [
        overloaded.length > 0
          ? `${overloaded.length} team member(s) have high workload (8+ active tasks)`
          : null,
        underutilized.length > 1
          ? `${underutilized.length} team members have low utilization`
          : null,
        avgCompletionRate < 60
          ? "Team completion rate is below optimal threshold"
          : null,
      ].filter(Boolean),

      recommendations: [
        overloaded.length > 0 && underutilized.length > 0
          ? `Redistribute tasks from ${overloaded.map((m) => m.user.name).join(", ")} to ${underutilized.map((m) => m.user.name).join(", ")}`
          : null,
        upcomingFollowUps > 10
          ? "High number of follow-ups - consider prioritizing and delegating"
          : null,
        recentCallsCount < 5
          ? "Increase calling activity to boost pipeline development"
          : null,
        `Recognize ${topPerformer.user.name}'s excellent performance to boost team morale`,
      ].filter(Boolean),

      metrics: {
        teamCompletionRate: Math.round(avgCompletionRate),
        totalActiveTasks: tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length,
        totalCompletedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
        weeklyCallVolume: recentCallsCount,
        pendingFollowUps: upcomingFollowUps,
        teamUtilization: userMetrics.map((m) => ({
          name: m.user.name,
          activeTasks: m.activeTasks,
          capacity: m.capacity,
          completionRate: m.completionRate,
        })),
      },

      actionItems: [
        {
          priority: "high",
          action: overloaded.length > 0 
            ? `Review workload for ${overloaded.map((m) => m.user.name).join(", ")}`
            : "Monitor team capacity and redistribute tasks as needed",
          assignedTo: "Sales Lead",
        },
        {
          priority: "medium",
          action: `Schedule 1:1s with team to discuss goals and blockers`,
          assignedTo: "Sales Lead",
        },
        {
          priority: "medium",
          action: upcomingFollowUps > 0
            ? `Ensure ${upcomingFollowUps} upcoming follow-ups are prepared`
            : "Increase follow-up activity for better conversion",
          assignedTo: "All",
        },
      ],
    };

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error generating insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

