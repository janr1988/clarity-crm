"use client";

import {
  BriefcaseIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

interface PipelineMetricsProps {
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  averageDealSize: number;
  conversionRate: number;
}

export default function PipelineMetrics({
  totalValue,
  weightedValue,
  dealCount,
  averageDealSize,
  conversionRate,
}: PipelineMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      title: "Pipeline Value",
      value: formatCurrency(totalValue),
      subtitle: `Weighted: ${formatCurrency(weightedValue)}`,
      icon: BriefcaseIcon,
      color: "blue",
    },
    {
      title: "Active Deals",
      value: dealCount.toString(),
      subtitle: "In pipeline",
      icon: ChartBarIcon,
      color: "blue",
    },
    {
      title: "Avg Deal Size",
      value: formatCurrency(averageDealSize),
      subtitle: "Per won deal",
      icon: CurrencyEuroIcon,
      color: "purple",
    },
    {
      title: "Win Rate",
      value: `${conversionRate.toFixed(1)}%`,
      subtitle: "Conversion rate",
      icon: PresentationChartLineIcon,
      color: "green",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          icon: "text-blue-600",
          value: "text-blue-700",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          icon: "text-purple-600",
          value: "text-purple-700",
        };
      case "green":
        return {
          bg: "bg-green-50",
          icon: "text-green-600",
          value: "text-green-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          icon: "text-gray-600",
          value: "text-gray-700",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const colors = getColorClasses(metric.color);

        return (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${colors.bg} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                </div>
              </div>
            </div>

            <div className="mb-2">
              <div className={`text-3xl font-bold ${colors.value}`}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metric.subtitle}
              </div>
            </div>

            {/* Visual indicator for certain metrics */}
            {metric.title === "Win Rate" && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      conversionRate >= 70
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : conversionRate >= 50
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                    style={{ width: `${Math.min(conversionRate, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {metric.title === "Pipeline Value" && (
              <div className="mt-3">
                <div className="text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-medium">{formatCurrency(totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weighted</span>
                    <span className="font-medium">{formatCurrency(weightedValue)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}