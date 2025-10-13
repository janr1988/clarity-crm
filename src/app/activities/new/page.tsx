import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ActivityCreateForm from "@/components/ActivityCreateForm";

async function getUsers() {
  return await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export default async function NewActivityPage() {
  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/activities"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Activities
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Log Activity</h1>
        <p className="text-gray-600 mt-1">Record a new activity</p>
      </div>

      <div className="bg-white p-6 rounded shadow-card max-w-2xl">
        <ActivityCreateForm users={users} />
      </div>
    </div>
  );
}

