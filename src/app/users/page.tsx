import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewUserList } from "@/lib/authorization";
import { redirect } from "next/navigation";

async function getUsers() {
  const users = await prisma.user.findMany({
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

  // Für jeden User Deal-Statistiken hinzufügen
  const usersWithDealStats = await Promise.all(
    users.map(async (user: any) => {
      const deals = await prisma.deal.findMany({
        where: { ownerId: user.id },
        select: {
          stage: true,
          value: true,
        },
      });

      const wonDeals = deals.filter((d: any) => d.stage === 'CLOSED_WON');
      const lostDeals = deals.filter((d: any) => d.stage === 'CLOSED_LOST');
      const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + d.value, 0);
      const totalDeals = deals.length;
      const closedDeals = wonDeals.length + lostDeals.length;
      const conversionRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;

      return {
        ...user,
        dealStats: {
          totalRevenue,
          conversionRate,
          totalDeals,
          wonDeals: wonDeals.length,
          lostDeals: lostDeals.length,
        },
      };
    })
  );

  return usersWithDealStats;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {users.map((user: any) => (
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

            {/* Deal Statistics */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sales Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(user.dealStats.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Revenue</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {user.dealStats.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Win Rate</div>
                  </div>
                </div>
              </div>
              
              {/* Deal Counts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {user.dealStats.totalDeals}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total Deals</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {user.dealStats.wonDeals}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Won</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {user.dealStats.lostDeals}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Lost</div>
                </div>
              </div>
            </div>

            {/* Activity Statistics */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {user._count.tasksAssigned}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tasks</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {user._count.activities}
                </div>
                <div className="text-xs text-gray-500 mt-1">Activities</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900">
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

