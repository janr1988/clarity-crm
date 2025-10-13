import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, getInitials, getStatusColor, getPriorityColor } from "@/lib/utils";

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
      tasksAssigned: {
        where: {
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        orderBy: { dueDate: "asc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      callNotes: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          tasksAssigned: true,
          activities: true,
          callNotes: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return user;
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser(params.id);

  const completedTasks = await prisma.task.count({
    where: {
      assigneeId: user.id,
      status: "COMPLETED",
    },
  });

  const activeTasks = user.tasksAssigned.length;
  const capacity = activeTasks < 5 ? "Available" : activeTasks < 8 ? "Moderate" : "Full";
  const capacityColor = activeTasks < 5 ? "text-green-600" : activeTasks < 8 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/users"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Team
        </Link>
        
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-medium">
              {getInitials(user.name)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {user.role.replace("_", " ")}
                </span>
                {user.team && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {user.team.name}
                  </span>
                )}
                <span className={`px-3 py-1 bg-gray-100 rounded-full text-sm font-medium ${capacityColor}`}>
                  Capacity: {capacity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Active Tasks</div>
          <div className="text-3xl font-bold text-primary">{activeTasks}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Completed Tasks</div>
          <div className="text-3xl font-bold text-green-600">{completedTasks}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Total Activities</div>
          <div className="text-3xl font-bold text-gray-900">{user._count.activities}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Call Notes</div>
          <div className="text-3xl font-bold text-gray-900">{user._count.callNotes}</div>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="bg-white p-6 rounded shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Tasks</h2>
          <Link
            href={`/tasks?assigneeId=${user.id}`}
            className="text-sm text-primary hover:text-primary-dark"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {user.tasksAssigned.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="block p-4 border border-gray-200 rounded hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                {task.dueDate && (
                  <div className="text-sm text-gray-600 ml-4">
                    Due: {formatDate(task.dueDate)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        {user.tasksAssigned.length === 0 && (
          <p className="text-gray-500 text-center py-8">No active tasks</p>
        )}
      </div>

      {/* Recent Activities and Call Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <Link
              href={`/activities?userId=${user.id}`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {user.activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="p-3 border border-gray-200 rounded"
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    {activity.type === "CALL" ? "📞" : activity.type === "MEETING" ? "👥" : activity.type === "EMAIL" ? "📧" : "📝"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  {activity.duration && (
                    <div className="text-sm text-gray-600">{activity.duration} min</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {user.activities.length === 0 && (
            <p className="text-gray-500 text-center py-8">No activities yet</p>
          )}
        </div>

        {/* Recent Call Notes */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Call Notes</h2>
            <Link
              href={`/call-notes?userId=${user.id}`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {user.callNotes.slice(0, 5).map((note) => (
              <Link
                key={note.id}
                href={`/call-notes/${note.id}`}
                className="block p-3 border border-gray-200 rounded hover:border-primary transition-colors"
              >
                <h4 className="font-medium text-gray-900">{note.clientName}</h4>
                {note.clientCompany && (
                  <p className="text-sm text-gray-600">{note.clientCompany}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(note.createdAt)}
                </p>
              </Link>
            ))}
          </div>
          {user.callNotes.length === 0 && (
            <p className="text-gray-500 text-center py-8">No call notes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

