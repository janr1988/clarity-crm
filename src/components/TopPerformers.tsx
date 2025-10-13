"use client";

import Link from "next/link";

interface TopPerformer {
  userId: string;
  name: string;
  email: string;
  revenue: number;
  dealsWon: number;
  conversionRate: number;
  avgDealSize: number;
}

interface TopPerformersProps {
  performers: TopPerformer[];
}

export default function TopPerformers({ performers }: TopPerformersProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `${index + 1}.`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        🏆 Top Performers
      </h3>

      <div className="space-y-4">
        {performers.map((performer, index) => (
          <Link
            key={performer.userId}
            href={`/users/${performer.userId}`}
            className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="text-2xl font-bold w-8 text-center">
              {getMedalEmoji(index)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900">{performer.name}</div>
              <div className="text-sm text-gray-500">{performer.email}</div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(performer.revenue)}
              </div>
              <div className="text-xs text-gray-500">
                {performer.dealsWon} deals • {performer.conversionRate.toFixed(0)}% conv.
              </div>
            </div>
          </Link>
        ))}
      </div>

      {performers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No performance data available
        </div>
      )}
    </div>
  );
}

