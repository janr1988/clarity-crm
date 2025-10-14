"use client";

import Link from "next/link";
import { TrophyIcon, CurrencyEuroIcon, ChartBarIcon } from "@heroicons/react/24/outline";

interface TopPerformer {
  userId: string;
  name: string;
  email: string;
  revenue: number;
  dealsWon: number;
  conversionRate: number;
  avgDealSize: number;
  totalDeals?: number;
  lostDeals?: number;
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
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-yellow-50 rounded-lg">
          <TrophyIcon className="h-6 w-6 text-yellow-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          Top Performers
        </h3>
      </div>

      <div className="space-y-4">
        {performers.map((performer, index) => (
          <Link
            key={performer.userId}
            href={`/users/${performer.userId}`}
            className="block p-4 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-2xl font-bold w-8 text-center">
                  {getMedalEmoji(index)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">{performer.name}</div>
                  <div className="text-sm text-gray-500">{performer.email}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="text-right">
                <div className="text-lg font-bold text-green-600 mb-1">
                  {formatCurrency(performer.revenue)}
                </div>
                <div className="text-xs text-gray-500">
                  Revenue
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {performer.conversionRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {performer.totalDeals || performer.dealsWon}
                </div>
                <div className="text-xs text-gray-500">Total Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {performer.dealsWon}
                </div>
                <div className="text-xs text-gray-500">Won</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {formatCurrency(performer.avgDealSize)}
                </div>
                <div className="text-xs text-gray-500">Avg Opportunity</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {performers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <TrophyIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p>No performance data available</p>
        </div>
      )}
    </div>
  );
}

