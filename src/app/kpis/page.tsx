"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { isSalesLead } from "@/lib/authorization";
import RevenueCard from "@/components/RevenueCard";
import PipelineFunnel from "@/components/PipelineFunnel";
import TopPerformers from "@/components/TopPerformers";
import PipelineMetrics from "@/components/PipelineMetrics";
import Link from "next/link";

interface TeamKPIs {
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
    conversionRate: number;
    avgDealSize: number;
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

export default function KPIsPage() {
  const { data: session, status } = useSession();
  const [kpis, setKpis] = useState<TeamKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/kpis/team");
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access denied: Only Sales Leads can view team KPIs");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setKpis(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === "authenticated" && isSalesLead(session)) {
      fetchKPIs();
    } else if (status === "authenticated" && !isSalesLead(session)) {
      setError("Access denied: Only Sales Leads can view team KPIs");
      setIsLoading(false);
    }
  }, [status, session]);

  if (status === "loading" || isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Team KPIs</h1>
        <div className="text-gray-600">Loading KPIs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Team KPIs</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">🚫 Access Denied</h2>
          <p className="text-red-800 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Team KPIs</h1>
        <div className="text-gray-600">No KPI data available</div>
      </div>
    );
  }

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team Performance KPIs</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive sales metrics and team performance overview
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Revenue Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RevenueCard
            title="Monthly Revenue"
            current={kpis.revenue.current}
            target={kpis.revenue.target}
            previous={kpis.revenue.previous}
            icon="📅"
          />
          <RevenueCard
            title="Quarterly Revenue"
            current={kpis.revenue.quarterly}
            target={kpis.revenue.quarterlyTarget}
            icon="📊"
          />
          <RevenueCard
            title="Yearly Revenue"
            current={kpis.revenue.yearly}
            target={kpis.revenue.yearlyTarget}
            icon="🎯"
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

      {/* Pipeline Funnel and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <PipelineFunnel stages={kpis.dealsByStage} />
        <TopPerformers performers={kpis.topPerformers} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">Sales Velocity</div>
          <div className="text-3xl font-bold text-gray-900">
            {kpis.velocity.avgDealCycle} days
          </div>
          <div className="text-xs text-gray-500 mt-2">Average deal cycle</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">90-Day Forecast</div>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(kpis.forecast.next90Days)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {kpis.forecast.dealCount} deals closing soon
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-card">
          <div className="text-sm font-medium text-gray-600 mb-2">Deal Summary</div>
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
            View All Deals
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

