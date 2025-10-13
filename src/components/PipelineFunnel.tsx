"use client";

import { 
  MagnifyingGlassIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

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

  const stageConfig: Record<string, { 
    label: string; 
    icon: any; 
    bgGradient: string; 
    textColor: string;
    bgColor: string;
  }> = {
    PROSPECTING: {
      label: "Prospecting",
      icon: MagnifyingGlassIcon,
      bgGradient: "bg-gradient-to-r from-blue-500 to-blue-600",
      textColor: "text-blue-700",
      bgColor: "bg-blue-50"
    },
    QUALIFICATION: {
      label: "Qualification",
      icon: UserIcon,
      bgGradient: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      textColor: "text-indigo-700",
      bgColor: "bg-indigo-50"
    },
    PROPOSAL: {
      label: "Proposal",
      icon: DocumentTextIcon,
      bgGradient: "bg-gradient-to-r from-purple-500 to-purple-600",
      textColor: "text-purple-700",
      bgColor: "bg-purple-50"
    },
    NEGOTIATION: {
      label: "Negotiation",
      icon: CurrencyEuroIcon,
      bgGradient: "bg-gradient-to-r from-pink-500 to-pink-600",
      textColor: "text-pink-700",
      bgColor: "bg-pink-50"
    },
    CLOSED_WON: {
      label: "Closed Won",
      icon: CheckCircleIcon,
      bgGradient: "bg-gradient-to-r from-green-500 to-green-600",
      textColor: "text-green-700",
      bgColor: "bg-green-50"
    },
    CLOSED_LOST: {
      label: "Closed Lost",
      icon: XCircleIcon,
      bgGradient: "bg-gradient-to-r from-red-500 to-red-600",
      textColor: "text-red-700",
      bgColor: "bg-red-50"
    },
  };

  const totalValue = stages.reduce((sum, s) => sum + s.value, 0);
  const totalDeals = stages.reduce((sum, s) => sum + s.count, 0);
  const activeDeals = stages.filter(s => !['CLOSED_WON', 'CLOSED_LOST'].includes(s.stage));
  const activeValue = activeDeals.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Sales Pipeline Funnel
        </h3>
        <div className="text-sm text-gray-500">
          {totalDeals} total deals
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const config = stageConfig[stage.stage] || stageConfig.PROSPECTING;
          const Icon = config.icon;
          const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          
          // Nur für aktive Pipeline Stages Conversion Rate berechnen
          const isActiveStage = !['CLOSED_WON', 'CLOSED_LOST'].includes(stage.stage);
          const showConversionRate = isActiveStage && index > 0;
          const conversionRate = showConversionRate 
            ? (stage.count / stages[index - 1].count) * 100 
            : null;

          // Spezielle Labels für Endpunkte
          const getStatusLabel = () => {
            switch (stage.stage) {
              case 'CLOSED_WON':
                return 'Closed Successfully';
              case 'CLOSED_LOST':
                return 'Lost';
              default:
                return null;
            }
          };

          const statusLabel = getStatusLabel();

          return (
            <div key={stage.stage} className="relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 ${config.bgColor} rounded-lg`}>
                    <Icon className={`h-5 w-5 ${config.textColor}`} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900">
                      {config.label}
                    </span>
                    <div className="text-xs text-gray-500">
                      {stage.avgDaysInStage} days avg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {stage.count} deals
                  </div>
                  <div className="text-xs text-gray-500">
                    {showConversionRate ? (
                      <span>{conversionRate.toFixed(0)}% conversion</span>
                    ) : statusLabel ? (
                      <span className={stage.stage === 'CLOSED_WON' ? 'text-green-600' : 'text-red-600'}>
                        {statusLabel}
                      </span>
                    ) : (
                      <span>Pipeline stage</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modern Progress Bar */}
              <div className="relative bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full ${config.bgGradient} rounded-full transition-all duration-500 ease-out relative`}
                  style={{ width: `${Math.max(widthPercent, 8)}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                </div>
                
                {/* Value overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-800 bg-white px-2 py-1 rounded-full shadow-sm">
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              </div>

              {/* Stage details */}
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Value: {formatCurrency(stage.value)}</span>
                <span>% of total: {totalValue > 0 ? ((stage.value / totalValue) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalValue)}
            </div>
            <div className="text-sm text-gray-500">Total Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(activeValue)}
            </div>
            <div className="text-sm text-gray-500">Active Pipeline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalDeals > 0 ? ((stages.find(s => s.stage === 'CLOSED_WON')?.count || 0) / totalDeals * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">Win Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}