import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";

async function getDashboardData(userId?: string, isLead?: boolean) {
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
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = {
    totalUsers: users.length,
    activeTasks: tasks.length,
    todayActivities: activities.filter(
      (a) =>
        new Date(a.createdAt).toDateString() === new Date().toDateString()
    ).length,
    totalCalls: callNotes.length,
  };

  return { users, tasks, activities, callNotes, stats };
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const isLead = isSalesLead(session);
  
  const { users, tasks, activities, stats } = await getDashboardData(
    session?.user?.id,
    isLead
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to Clarity CRM, {session?.user?.name}
        </p>
      </div>

      {/* Team Performance KPIs - Only for Sales Lead */}
      {isLead && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Team Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Active Team Members</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Team Active Tasks</div>
              <div className="text-3xl font-bold text-primary">{stats.activeTasks}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Today&apos;s Activities</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.todayActivities}
              </div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Recent Calls</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCalls}</div>
            </div>
          </div>
        </div>
      )}

      {/* Personal Stats - For Sales Agents */}
      {!isLead && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📈 My Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Active Tasks</div>
              <div className="text-3xl font-bold text-primary">{stats.activeTasks}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Activities Today</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.todayActivities}
              </div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Recent Calls</div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCalls}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Overview - Only for Sales Lead */}
        {isLead && (
          <div className="bg-white p-6 rounded shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <Link
                href="/users"
                className="text-sm text-primary hover:text-primary-dark"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <Link
                  key={user.id}
                  href={`/users/${user.id}`}
                  className="flex items-center justify-between p-3 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.role}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user._count.tasksAssigned} tasks
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Tasks */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isLead ? "Team Active Tasks" : "My Active Tasks"}
            </h2>
            <Link
              href="/tasks"
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block p-3 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {task.assignee?.name || "Unassigned"}
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="text-sm text-gray-600 ml-4">
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className={`bg-white p-6 rounded shadow-card ${isLead ? 'lg:col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isLead ? "Team Recent Activities" : "My Recent Activities"}
            </h2>
            <Link
              href="/activities"
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded hover:bg-gray-50"
              >
                <div className="text-2xl">{activity.type === "CALL" ? "📞" : activity.type === "MEETING" ? "👥" : activity.type === "EMAIL" ? "📧" : "📝"}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {activity.title}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {activity.user.name} • {formatDate(activity.createdAt)}
                  </div>
                </div>
                {activity.duration && (
                  <div className="text-sm text-gray-600">
                    {activity.duration} min
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

