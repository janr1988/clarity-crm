"use client";

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Pipeline Value</div>
          <span className="text-2xl">💼</span>
        </div>
        <div className="text-3xl font-bold text-gray-900">
          {formatCurrency(totalValue)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Weighted: {formatCurrency(weightedValue)}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Active Deals</div>
          <span className="text-2xl">📊</span>
        </div>
        <div className="text-3xl font-bold text-blue-600">{dealCount}</div>
        <div className="text-xs text-gray-500 mt-2">In pipeline</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Avg Deal Size</div>
          <span className="text-2xl">💎</span>
        </div>
        <div className="text-3xl font-bold text-purple-600">
          {formatCurrency(averageDealSize)}
        </div>
        <div className="text-xs text-gray-500 mt-2">Per won deal</div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-card">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Win Rate</div>
          <span className="text-2xl">🎯</span>
        </div>
        <div className="text-3xl font-bold text-green-600">
          {conversionRate.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-500 mt-2">Conversion rate</div>
      </div>
    </div>
  );
}

