import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewUserList } from "@/lib/authorization";
import { redirect } from "next/navigation";

async function getUsers() {
  return await prisma.user.findMany({
    where: { isActive: true },
    include: {
      team: true,
      _count: {
        select: {
          tasksAssigned: true,
          activities: true,
          callNotes: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Sales Agent can only view their own profile
  if (!canViewUserList(session)) {
    redirect(`/users/${session.user.id}`);
  }

  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage your sales team</p>
        </div>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
        >
          Add Member
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/users/${user.id}`}
            className="bg-white p-6 rounded shadow-card hover:shadow-hover transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{user.role.replace("_", " ")}</p>
                {user.team && (
                  <p className="text-sm text-gray-500 mt-1">{user.team.name}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {user._count.tasksAssigned}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {user._count.activities}
                </div>
                <div className="text-xs text-gray-500 mt-1">Activities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {user._count.callNotes}
                </div>
                <div className="text-xs text-gray-500 mt-1">Calls</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No team members found</p>
        </div>
      )}
    </div>
  );
}

