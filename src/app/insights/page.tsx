import Link from "next/link";
import AIInsights from "@/components/AIInsights";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewAIInsights } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Only Sales Lead can access AI insights
  if (!canViewAIInsights(session)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            🚫 Access Denied
          </h2>
          <p className="text-red-800 mb-4">
            AI Insights are only available for Sales Leads.
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
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">AI Team Insights</h1>
        <p className="text-gray-600 mt-1">
          AI-powered analysis and recommendations for your sales team
        </p>
      </div>

      <AIInsights />
    </div>
  );
}

