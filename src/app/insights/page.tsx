import Link from "next/link";
import AIInsights from "@/components/AIInsights";

export default function InsightsPage() {
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

