"use client";

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  avgDaysInStage: number;
}

interface PipelineFunnelProps {
  stages: FunnelStage[];
}

export default function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageColors: Record<string, string> = {
    PROSPECTING: "bg-blue-500",
    QUALIFICATION: "bg-indigo-500",
    PROPOSAL: "bg-purple-500",
    NEGOTIATION: "bg-pink-500",
    CLOSED_WON: "bg-green-500",
    CLOSED_LOST: "bg-red-500",
  };

  const stageLabels: Record<string, string> = {
    PROSPECTING: "Prospecting",
    QUALIFICATION: "Qualification",
    PROPOSAL: "Proposal",
    NEGOTIATION: "Negotiation",
    CLOSED_WON: "Closed Won",
    CLOSED_LOST: "Closed Lost",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Sales Pipeline Funnel
      </h3>

      <div className="space-y-4">
        {stages.map((stage) => {
          const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;

          return (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {stageLabels[stage.stage] || stage.stage}
                </span>
                <span className="text-sm text-gray-500">
                  {stage.count} deals • {stage.avgDaysInStage} days avg
                </span>
              </div>

              <div className="relative">
                <div
                  className={`${
                    stageColors[stage.stage] || "bg-gray-500"
                  } rounded-r-lg h-12 flex items-center px-4 text-white font-semibold transition-all`}
                  style={{ width: `${Math.max(widthPercent, 15)}%` }}
                >
                  {formatCurrency(stage.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Total Pipeline</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(stages.reduce((sum, s) => sum + s.value, 0))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Total Deals</div>
            <div className="text-lg font-bold text-gray-900">
              {stages.reduce((sum, s) => sum + s.count, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

