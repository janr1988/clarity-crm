import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DealDetailContent from "./DealDetailContent";

interface DealDetailPageProps {
  params: { id: string };
}

export default async function DealDetailPage({ params }: DealDetailPageProps) {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  const dealId = params.id;

  // Verify deal exists and get basic info
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { 
      id: true, 
      name: true, 
      ownerId: true,
      createdBy: true
    },
  });

  if (!deal) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Deal not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-gray-200 rounded-lg h-96 mb-6"></div>
              <div className="bg-gray-200 rounded-lg h-64"></div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-200 rounded-lg h-48"></div>
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          </div>
        </div>
      }>
        <DealDetailContent dealId={dealId} />
      </Suspense>
    </div>
  );
}
