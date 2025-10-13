"use client";

import { 
  CurrencyEuroIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TrophyIcon
} from "@heroicons/react/24/outline";

interface RevenueCardProps {
  title: string;
  current: number;
  target: number;
  previous?: number;
  icon?: "currency" | "chart" | "calendar" | "trophy";
}

export default function RevenueCard({
  title,
  current,
  target,
  previous,
  icon = "currency",
}: RevenueCardProps) {
  const achievement = target > 0 ? (current / target) * 100 : 0;
  const growth = previous !== undefined && previous > 0 ? ((current - previous) / previous) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIcon = () => {
    switch (icon) {
      case "chart":
        return ChartBarIcon;
      case "calendar":
        return CalendarDaysIcon;
      case "trophy":
        return TrophyIcon;
      default:
        return CurrencyEuroIcon;
    }
  };

  const Icon = getIcon();

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatCurrency(current)}
        </div>
        <div className="text-sm text-gray-500">
          Target: {formatCurrency(target)}
        </div>
      </div>

      {/* Growth Indicator */}
      {previous !== undefined && previous > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            growth >= 0 
              ? "bg-green-50 text-green-700" 
              : "bg-red-50 text-red-700"
          }`}>
            {growth >= 0 ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            <span>{Math.abs(growth).toFixed(1)}%</span>
          </div>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress</span>
          <span>{achievement.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              achievement >= 100
                ? "bg-gradient-to-r from-green-500 to-green-600"
                : achievement >= 75
                ? "bg-gradient-to-r from-blue-500 to-blue-600"
                : achievement >= 50
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
            style={{ width: `${Math.min(achievement, 100)}%` }}
          />
        </div>
      </div>

      {/* Achievement Status */}
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium ${
          achievement >= 100
            ? "text-green-700"
            : achievement >= 75
            ? "text-blue-700"
            : achievement >= 50
            ? "text-yellow-700"
            : "text-red-700"
        }`}>
          {achievement >= 100 ? "🎯 Target Achieved" :
           achievement >= 75 ? "📈 On Track" :
           achievement >= 50 ? "⚠️ Behind Target" : "🚨 Critical"}
        </div>
      </div>
    </div>
  );
}