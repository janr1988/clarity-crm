import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TaskCreateForm from "@/components/TaskCreateForm";

async function getUsers() {
  return await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export default async function NewTaskPage() {
  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/tasks"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Tasks
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
        <p className="text-gray-600 mt-1">Add a new task for your team</p>
      </div>

      <div className="bg-white p-6 rounded shadow-card max-w-2xl">
        <TaskCreateForm users={users} />
      </div>
    </div>
  );
}

