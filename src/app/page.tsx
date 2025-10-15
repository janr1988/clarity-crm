import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardPageContent from "./DashboardPageContent";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }
  
  const isLead = isSalesLead(session);

  // Get team ID for Sales Lead
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  });
  
  const teamId = user?.teamId;

  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <DashboardPageContent 
        userId={session.user.id}
        isLead={isLead}
        userName={session.user.name}
        teamId={teamId || undefined}
      />
    </Suspense>
  );
}