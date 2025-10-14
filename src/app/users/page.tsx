import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewUserList } from "@/lib/authorization";
import { redirect } from "next/navigation";
import UsersPageContent from "./UsersPageContent";

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
  const teamId = session.user.teamId || "";

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage your sales team with capacity insights</p>
          {/* Team ID Debug Info */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <span className="text-blue-700">
              <strong>Team ID:</strong> {teamId}
            </span>
          </div>
        </div>
        <Link
          href="/users/new"
          className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
        >
          Add Member
        </Link>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
          ))}
        </div>
      }>
        <UsersPageContent users={users} teamId={teamId} />
      </Suspense>
    </div>
  );
}

