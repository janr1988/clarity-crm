import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewUserDetails } from "@/lib/authorization";
import UserDetailsContent from "@/components/UserDetailsContent";

async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      team: true,
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
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Check if user can view this user's details
  if (!canViewUserDetails(session, params.id)) {
    redirect("/dashboard");
  }

  const user = await getUser(params.id);

  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded w-full mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <UserDetailsContent user={user} />
    </Suspense>
  );
}

