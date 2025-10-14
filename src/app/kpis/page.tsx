import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import { redirect } from "next/navigation";
import Link from "next/link";
import RevenueCard from "@/components/RevenueCard";
import PipelineFunnel from "@/components/PipelineFunnel";
import TopPerformers from "@/components/TopPerformers";
import PipelineMetrics from "@/components/PipelineMetrics";
import RevenueChart from "@/components/RevenueChart";
import DealsByStageChart from "@/components/DealsByStageChart";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getTeamKPIs() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Get basic data
  const [deals, targets, users] = await Promise.all([
    prisma.deal.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, industry: true } },
      },
    }),
    prisma.target.findMany({
      where: { year: currentYear },
    }),
    prisma.user.findMany({
      where: { role: "SALES_AGENT", isActive: true },
      select: { id: true, name: true, email: true },
    }),
  ]);

  // Calculate basic metrics
  const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
  const lostDeals = deals.filter((d) => d.stage === "CLOSED_LOST");
  const activeDeals = deals.filter(
    (d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST"
  );

  // Revenue calculations
  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = activeDeals.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );

  // Monthly revenue
  const currentMonthRevenue = wonDeals
    .filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear
    )
    .reduce((sum, d) => sum + d.value, 0);

  // Previous month revenue
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const prevMonthRevenue = wonDeals
    .filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === prevMonth &&
        d.actualCloseDate.getFullYear() === prevYear
    )
    .reduce((sum, d) => sum + d.value, 0);

  // Quarterly revenue
  const quarterlyRevenue = wonDeals
    .filter(
      (d) =>
        d.actualCloseDate &&
        Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
        d.actualCloseDate.getFullYear() === currentYear
    )
    .reduce((sum, d) => sum + d.value, 0);

  // Targets
  const monthlyTarget = targets.find(
    (t) => t.period === "MONTHLY" && t.month === currentMonth && t.userId === null
  );
  const quarterlyTarget = targets.find(
    (t) => t.period === "QUARTERLY" && t.quarter === currentQuarter && t.userId === null
  );
  const yearlyTarget = targets.find((t) => t.period === "YEARLY" && t.userId === null);

  // Performance metrics
  const totalClosed = wonDeals.length + lostDeals.length;
  const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
  const averageDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  // Deal stage distribution
  const dealsByStage = [
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ].map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      avgDaysInStage: 30, // Simplified for now
    };
  });

  // Generate monthly revenue data for charts (last 12 months)
  const monthlyRevenueData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleDateString('de-DE', { month: 'short' });
    const year = date.getFullYear();
    const monthNum = date.getMonth() + 1;
    
    const monthRevenue = wonDeals
      .filter(d => 
        d.actualCloseDate?.getFullYear() === year && 
        d.actualCloseDate.getMonth() + 1 === monthNum
      )
      .reduce((sum, d) => sum + d.value, 0);
    
    const monthTarget = targets.find(
      t => t.period === "MONTHLY" && t.month === monthNum && t.userId === null
    )?.targetValue || 0;
    
    monthlyRevenueData.push({
      month,
      revenue: monthRevenue,
      target: monthTarget,
      previousYear: Math.floor(monthRevenue * 0.8), // Simulated previous year data
    });
  }

  // Top performers
  const topPerformers = users.map((user) => {
    const userWonDeals = wonDeals.filter((d) => d.ownerId === user.id);
    const userTotalDeals = deals.filter((d) => d.ownerId === user.id);
    const userLostDeals = userTotalDeals.filter((d) => d.stage === "CLOSED_LOST");
    const userRevenue = userWonDeals.reduce((sum, d) => sum + d.value, 0);
    
    // Conversion Rate basierend auf geschlossenen Deals (nicht allen Deals)
    const userClosedDeals = userWonDeals.length + userLostDeals.length;
    const userConversionRate = userClosedDeals > 0 ? (userWonDeals.length / userClosedDeals) * 100 : 0;
    const userAvgDealSize = userWonDeals.length > 0 ? userRevenue / userWonDeals.length : 0;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      revenue: userRevenue,
      dealsWon: userWonDeals.length,
      dealsLost: userLostDeals.length,
      totalDeals: userTotalDeals.length,
      conversionRate: parseFloat(userConversionRate.toFixed(2)),
      avgDealSize: parseFloat(userAvgDealSize.toFixed(2)),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    revenue: {
      current: currentMonthRevenue,
      previous: prevMonthRevenue,
      growth: prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0,
      target: monthlyTarget?.targetValue || 0,
      achievement: monthlyTarget?.targetValue ? (currentMonthRevenue / monthlyTarget.targetValue) * 100 : 0,
      quarterly: quarterlyRevenue,
      quarterlyTarget: quarterlyTarget?.targetValue || 0,
      yearly: totalRevenue,
      yearlyTarget: yearlyTarget?.targetValue || 0,
    },
    pipeline: {
      totalValue: pipelineValue,
      weightedValue: weightedPipelineValue,
      dealCount: activeDeals.length,
      averageDealSize: parseFloat(averageDealSize.toFixed(2)),
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    },
    dealsByStage,
    topPerformers,
    monthlyRevenueData,
    velocity: {
      avgDealCycle: 45, // Simplified for now
    },
    forecast: {
      next90Days: weightedPipelineValue * 0.3, // Simplified forecast
      dealCount: activeDeals.filter((d) => d.probability >= 70).length,
    },
    summary: {
      totalDeals: deals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      activeDeals: activeDeals.length,
    },
  };
}

export default async function KPIsPage() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Only Sales Lead can access KPIs
  if (!isSalesLead(session)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">🚫 Access Denied</h2>
          <p className="text-red-800 mb-4">
            Team KPIs are only available for Sales Leads.
          </p>
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

  const kpis = await getTeamKPIs();

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={kpis.monthlyRevenueData} />
              <DealsByStageChart data={kpis.dealsByStage} />
            </div>
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