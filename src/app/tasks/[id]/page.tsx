import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime, getStatusColor, getPriorityColor } from "@/lib/utils";
import TaskEditForm from "@/components/TaskEditForm";

async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      createdBy: true,
      team: true,
    },
  });

  if (!task) {
    notFound();
  }

  return task;
}

async function getUsers() {
  return await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [task, users] = await Promise.all([getTask(params.id), getUsers()]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/tasks"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Tasks
        </Link>

        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded text-sm ${getStatusColor(task.status)}`}>
                  {task.status.replace("_", " ")}
                </span>
                <span className={`px-3 py-1 rounded text-sm ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Assigned To</div>
              {task.assignee ? (
                <Link
                  href={`/users/${task.assignee.id}`}
                  className="text-gray-900 font-medium hover:text-primary"
                >
                  {task.assignee.name}
                </Link>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Created By</div>
              <Link
                href={`/users/${task.createdBy.id}`}
                className="text-gray-900 font-medium hover:text-primary"
              >
                {task.createdBy.name}
              </Link>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Due Date</div>
              <div className="text-gray-900 font-medium">
                {task.dueDate ? formatDateTime(task.dueDate) : "Not set"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Team</div>
              <div className="text-gray-900 font-medium">
                {task.team?.name || "No team"}
              </div>
            </div>
          </div>

          {task.description && (
            <div>
              <div className="text-sm text-gray-600 mb-2">Description</div>
              <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Created {formatDateTime(task.createdAt)} • Updated {formatDateTime(task.updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-6 rounded shadow-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Task</h2>
        <TaskEditForm task={task} users={users} />
      </div>
    </div>
  );
}

