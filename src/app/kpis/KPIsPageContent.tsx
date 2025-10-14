"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TimeFilter as TimeFilterType, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterComponent from "@/components/TimeFilter";
import RevenueCard from "@/components/RevenueCard";
import PipelineFunnel from "@/components/PipelineFunnel";
import TopPerformers from "@/components/TopPerformers";
import PipelineMetrics from "@/components/PipelineMetrics";
import RevenueChart from "@/components/RevenueChart";
import DealsByStageChart from "@/components/DealsByStageChart";

interface KPIsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    target: number;
    achievement: number;
    quarterly: number;
    quarterlyTarget: number;
    yearly: number;
    yearlyTarget: number;
  };
  pipeline: {
    totalValue: number;
    weightedValue: number;
    dealCount: number;
    averageDealSize: number;
    conversionRate: number;
  };
  dealsByStage: Array<{
    stage: string;
    count: number;
    value: number;
    avgDaysInStage: number;
  }>;
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    revenue: number;
    dealsWon: number;
    dealsLost: number;
    totalDeals: number;
    conversionRate: number;
    avgDealSize: number;
  }>;
  monthlyRevenueData: Array<{
    month: string;
    revenue: number;
    target: number;
    previousYear: number;
  }>;
  velocity: {
    avgDealCycle: number;
  };
  forecast: {
    next90Days: number;
    dealCount: number;
  };
  summary: {
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    activeDeals: number;
  };
}

async function getKPIs(timeFilter: TimeFilterType): Promise<KPIsData> {
  const response = await fetch(`/api/kpis/team?filter=${timeFilter}`);
  if (!response.ok) {
    throw new Error('Failed to fetch KPIs');
  }
  return response.json();
}

export default function KPIsPageContent() {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('kpis');
  
  const [kpis, setKpis] = useState<KPIsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setLoading(true);
        const kpisData = await getKPIs(timeFilter);
        setKpis(kpisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchKPIs();
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Performance KPIs</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive sales metrics and team performance overview
          </p>
        </div>
        <TimeFilterComponent page="kpis" />
      </div>

      {/* Revenue Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Revenue Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          <RevenueCard
            title="Monthly Revenue"
            current={kpis.revenue.current}
            target={kpis.revenue.target}
            previous={kpis.revenue.previous}
            icon="calendar"
          />
          <RevenueCard
            title="Quarterly Revenue"
            current={kpis.revenue.quarterly}
            target={kpis.revenue.quarterlyTarget}
            icon="chart"
          />
          <RevenueCard
            title="Yearly Revenue"
            current={kpis.revenue.yearly}
            target={kpis.revenue.yearlyTarget}
            icon="trophy"
          />
        </div>
      </div>

      {/* Pipeline Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💼 Pipeline Overview</h2>
        <PipelineMetrics
          totalValue={kpis.pipeline.totalValue}
          weightedValue={kpis.pipeline.weightedValue}
          dealCount={kpis.pipeline.dealCount}
          averageDealSize={kpis.pipeline.averageDealSize}
          conversionRate={kpis.pipeline.conversionRate}
        />
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Analytics & Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <RevenueChart data={kpis.monthlyRevenueData} />
          <DealsByStageChart data={kpis.dealsByStage} />
        </div>
      </div>

      {/* Pipeline Funnel and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <PipelineFunnel stages={kpis.dealsByStage} />
        <TopPerformers performers={kpis.topPerformers} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">Sales Velocity</div>
          <div className="text-3xl font-bold text-gray-900">
            {kpis.velocity.avgDealCycle} days
          </div>
          <div className="text-xs text-gray-500 mt-2">Average opportunity cycle</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">90-Day Forecast</div>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(kpis.forecast.next90Days)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {kpis.forecast.dealCount} opportunities closing soon
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">Opportunity Summary</div>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Won:</span>
              <span className="font-semibold text-green-600">{kpis.summary.wonDeals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Lost:</span>
              <span className="font-semibold text-red-600">{kpis.summary.lostDeals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-blue-600">{kpis.summary.activeDeals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <Link
            href="/deals"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View All Opportunities
          </Link>
          <Link
            href="/users"
            className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            Manage Team
          </Link>
          <Link
            href="/insights"
            className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            AI Insights
          </Link>
        </div>
      </div>
    </div>
  );
}
