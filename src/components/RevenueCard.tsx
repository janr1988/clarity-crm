"use client";

interface RevenueCardProps {
  title: string;
  current: number;
  target: number;
  previous?: number;
  icon?: string;
}

export default function RevenueCard({
  title,
  current,
  target,
  previous,
  icon = "💰",
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <span className="text-2xl">{icon}</span>
      </div>

      <div className="text-3xl font-bold text-gray-900 mb-2">
        {formatCurrency(current)}
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-gray-500">
          Target: {formatCurrency(target)}
        </span>
        {previous !== undefined && previous > 0 && (
          <span
            className={`font-medium ${
              growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {growth >= 0 ? "↑" : "↓"} {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            achievement >= 100
              ? "bg-green-500"
              : achievement >= 75
              ? "bg-blue-500"
              : achievement >= 50
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${Math.min(achievement, 100)}%` }}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2 text-right">
        {achievement.toFixed(1)}% of target
      </div>
    </div>
  );
}

