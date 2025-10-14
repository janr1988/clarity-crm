import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import Link from "next/link";
import DealsPageContent from "./DealsPageContent";

export default async function DealsPage() {
  const session = await getServerSession(authOptions);
  
  // Only Sales Lead can access deals
  if (!isSalesLead(session)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">🚫 Access Denied</h2>
          <p className="text-red-800 mb-4">
            Deals management is only available for Sales Leads.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <DealsPageContent />
    </Suspense>
  );
}