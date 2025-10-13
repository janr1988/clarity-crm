# 📊 KPI Dashboard Implementation Guide

## Übersicht

Dieses Dokument beschreibt die komplette Implementierung des KPI Dashboards für Clarity CRM. Die Datenbank ist bereits vorbereitet mit 250 Deals und €36.6M Umsatz.

---

## ✅ Bereits implementiert

- ✅ Deal/Opportunity Model (250 Deals)
- ✅ Target Model (Revenue Targets)
- ✅ DealNote Model
- ✅ Seed-Daten mit realistischen Werten
- ✅ Datenbank-Schema komplett

---

## 📋 Implementierungs-Schritte

### **Schritt 1: KPI API Routes erstellen**

#### **1.1 Team KPIs API** (`src/app/api/kpis/team/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewTeamPerformance } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Sales Lead can view team KPIs
    if (!canViewTeamPerformance(session)) {
      return NextResponse.json(
        { error: "Forbidden: Only Sales Leads can view team KPIs" },
        { status: 403 }
      );
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Get all deals
    const [allDeals, users, targets] = await Promise.all([
      prisma.deal.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true } },
          company: { select: { id: true, name: true, industry: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "SALES_AGENT", isActive: true },
        select: { id: true, name: true, email: true },
      }),
      prisma.target.findMany({
        where: {
          year: currentYear,
          OR: [
            { period: "MONTHLY", month: currentMonth },
            { period: "QUARTERLY", quarter: currentQuarter },
            { period: "YEARLY" },
          ],
        },
      }),
    ]);

    // Calculate revenue metrics
    const wonDeals = allDeals.filter(d => d.stage === "CLOSED_WON");
    const lostDeals = allDeals.filter(d => d.stage === "CLOSED_LOST");
    const activeDeals = allDeals.filter(
      d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    // Monthly revenue
    const monthlyWonDeals = wonDeals.filter(
      d =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const currentMonthRevenue = monthlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Previous month for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthWonDeals = wonDeals.filter(
      d =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === prevMonth &&
        d.actualCloseDate.getFullYear() === prevYear
    );
    const previousMonthRevenue = prevMonthWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Quarterly revenue
    const quarterlyWonDeals = wonDeals.filter(
      d =>
        d.actualCloseDate &&
        Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const currentQuarterRevenue = quarterlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Yearly revenue
    const yearlyWonDeals = wonDeals.filter(
      d => d.actualCloseDate && d.actualCloseDate.getFullYear() === currentYear
    );
    const currentYearRevenue = yearlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Get targets
    const monthlyTarget = targets.find(t => t.period === "MONTHLY" && !t.userId);
    const quarterlyTarget = targets.find(t => t.period === "QUARTERLY" && !t.userId);
    const yearlyTarget = targets.find(t => t.period === "YEARLY" && !t.userId);

    // Pipeline metrics
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipelineValue = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    const averageDealSize =
      wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0;

    // Conversion rate
    const totalClosedDeals = wonDeals.length + lostDeals.length;
    const conversionRate =
      totalClosedDeals > 0 ? (wonDeals.length / totalClosedDeals) * 100 : 0;

    // Deal stage distribution
    const dealsByStage = [
      "PROSPECTING",
      "QUALIFICATION",
      "PROPOSAL",
      "NEGOTIATION",
      "CLOSED_WON",
      "CLOSED_LOST",
    ].map(stage => {
      const stageDeals = allDeals.filter(d => d.stage === stage);
      const avgDays =
        stageDeals.length > 0
          ? stageDeals.reduce((sum, d) => sum + (d.daysInStage || 0), 0) / stageDeals.length
          : 0;

      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        avgDaysInStage: Math.round(avgDays),
      };
    });

    // Top performers
    const topPerformers = users.map(user => {
      const userWonDeals = wonDeals.filter(d => d.ownerId === user.id);
      const userLostDeals = lostDeals.filter(d => d.ownerId === user.id);
      const userTotalClosed = userWonDeals.length + userLostDeals.length;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        revenue: userWonDeals.reduce((sum, d) => sum + d.value, 0),
        dealsWon: userWonDeals.length,
        dealsLost: userLostDeals.length,
        conversionRate:
          userTotalClosed > 0 ? (userWonDeals.length / userTotalClosed) * 100 : 0,
        avgDealSize:
          userWonDeals.length > 0
            ? userWonDeals.reduce((sum, d) => sum + d.value, 0) / userWonDeals.length
            : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Sales velocity
    const avgDealCycle =
      wonDeals.filter(d => d.totalDuration).length > 0
        ? wonDeals
            .filter(d => d.totalDuration)
            .reduce((sum, d) => sum + (d.totalDuration || 0), 0) /
          wonDeals.filter(d => d.totalDuration).length
        : 0;

    // Forecast (next 90 days)
    const upcomingDeals = activeDeals.filter(
      d =>
        d.expectedCloseDate &&
        d.expectedCloseDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );
    const forecastValue = upcomingDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );

    const kpis = {
      revenue: {
        current: currentMonthRevenue,
        previous: previousMonthRevenue,
        growth:
          previousMonthRevenue > 0
            ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
            : 0,
        target: monthlyTarget?.targetValue || 0,
        achievement:
          monthlyTarget?.targetValue
            ? (currentMonthRevenue / monthlyTarget.targetValue) * 100
            : 0,
        quarterly: currentQuarterRevenue,
        quarterlyTarget: quarterlyTarget?.targetValue || 0,
        yearly: currentYearRevenue,
        yearlyTarget: yearlyTarget?.targetValue || 0,
      },
      pipeline: {
        totalValue: pipelineValue,
        weightedValue: weightedPipelineValue,
        dealCount: activeDeals.length,
        averageDealSize,
        conversionRate,
      },
      dealsByStage,
      topPerformers: topPerformers.slice(0, 5),
      velocity: {
        avgDealCycle: Math.round(avgDealCycle),
      },
      forecast: {
        next90Days: forecastValue,
        dealCount: upcomingDeals.length,
      },
      summary: {
        totalDeals: allDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        activeDeals: activeDeals.length,
      },
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching team KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch team KPIs" },
      { status: 500 }
    );
  }
}
```

---

#### **1.2 Agent KPIs API** (`src/app/api/kpis/agent/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User can only view their own KPIs unless they're a Sales Lead
    if (
      session.user.role !== "SALES_LEAD" &&
      session.user.id !== params.id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only view your own KPIs" },
        { status: 403 }
      );
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    // Get user's deals and targets
    const [deals, targets, user, allUsers] = await Promise.all([
      prisma.deal.findMany({
        where: { ownerId: params.id },
        include: {
          customer: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.target.findMany({
        where: {
          userId: params.id,
          year: currentYear,
        },
      }),
      prisma.user.findUnique({
        where: { id: params.id },
        select: { id: true, name: true, email: true, role: true },
      }),
      prisma.user.findMany({
        where: { role: "SALES_AGENT", isActive: true },
        select: { id: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const wonDeals = deals.filter(d => d.stage === "CLOSED_WON");
    const lostDeals = deals.filter(d => d.stage === "CLOSED_LOST");
    const activeDeals = deals.filter(
      d => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    // Monthly revenue
    const monthlyWonDeals = wonDeals.filter(
      d =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const monthlyRevenue = monthlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthWonDeals = wonDeals.filter(
      d =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === prevMonth &&
        d.actualCloseDate.getFullYear() === prevYear
    );
    const prevMonthRevenue = prevMonthWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Targets
    const monthlyTarget = targets.find(t => t.period === "MONTHLY");
    const quarterlyTarget = targets.find(t => t.period === "QUARTERLY");
    const yearlyTarget = targets.find(t => t.period === "YEARLY");

    // Calculate rank
    const allAgentRevenues = await Promise.all(
      allUsers.map(async u => {
        const userDeals = await prisma.deal.findMany({
          where: {
            ownerId: u.id,
            stage: "CLOSED_WON",
            actualCloseDate: {
              gte: new Date(currentYear, 0, 1),
              lte: new Date(currentYear, 11, 31),
            },
          },
        });
        return {
          userId: u.id,
          revenue: userDeals.reduce((sum, d) => sum + d.value, 0),
        };
      })
    );
    const sortedRevenues = allAgentRevenues.sort((a, b) => b.revenue - a.revenue);
    const rank = sortedRevenues.findIndex(r => r.userId === params.id) + 1;

    // Pipeline
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipelineValue = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    const hotDeals = activeDeals.filter(d => d.probability >= 70);

    // Performance
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
    const avgDealSize =
      wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0;
    const avgDealCycle =
      wonDeals.filter(d => d.totalDuration).length > 0
        ? wonDeals
            .filter(d => d.totalDuration)
            .reduce((sum, d) => sum + (d.totalDuration || 0), 0) /
          wonDeals.filter(d => d.totalDuration).length
        : 0;

    // Deals by stage
    const dealsByStage = [
      "PROSPECTING",
      "QUALIFICATION",
      "PROPOSAL",
      "NEGOTIATION",
    ].map(stage => ({
      stage,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
    }));

    // Upcoming
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dealsClosingThisWeek = activeDeals.filter(
      d => d.expectedCloseDate && d.expectedCloseDate >= today && d.expectedCloseDate <= nextWeek
    );

    const kpis = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      revenue: {
        thisMonth: monthlyRevenue,
        lastMonth: prevMonthRevenue,
        growth:
          prevMonthRevenue > 0
            ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
            : 0,
        target: monthlyTarget?.targetValue || 0,
        achievement: monthlyTarget?.targetValue
          ? (monthlyRevenue / monthlyTarget.targetValue) * 100
          : 0,
        rank,
      },
      pipeline: {
        totalValue: pipelineValue,
        weightedValue: weightedPipelineValue,
        dealCount: activeDeals.length,
        hotDeals: hotDeals.length,
      },
      dealsByStage,
      performance: {
        dealsWon: wonDeals.length,
        dealsLost: lostDeals.length,
        conversionRate,
        avgDealSize,
        avgDealCycle: Math.round(avgDealCycle),
      },
      upcoming: {
        dealsClosingThisWeek: dealsClosingThisWeek.length,
        dealsClosingThisWeekValue: dealsClosingThisWeek.reduce((sum, d) => sum + d.value, 0),
      },
      targets: {
        monthly: monthlyTarget,
        quarterly: quarterlyTarget,
        yearly: yearlyTarget,
      },
    };

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching agent KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent KPIs" },
      { status: 500 }
    );
  }
}
```

---

### **Schritt 2: Deals API Routes**

#### **2.1 Deals List/Create** (`src/app/api/deals/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createDealSchema = z.object({
  name: z.string().min(1),
  customerId: z.string(),
  companyId: z.string(),
  value: z.number().positive(),
  probability: z.number().min(0).max(100).default(50),
  stage: z.string().default("PROSPECTING"),
  expectedCloseDate: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const ownerId = searchParams.get("ownerId");

    // Sales Agent can only see their own deals
    const isAgent = session.user.role === "SALES_AGENT";
    const filterOwnerId = isAgent ? session.user.id : ownerId;

    const deals = await prisma.deal.findMany({
      where: {
        ...(stage && { stage }),
        ...(filterOwnerId && { ownerId: filterOwnerId }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true, industry: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDealSchema.parse(body);

    const deal = await prisma.deal.create({
      data: {
        ...validatedData,
        ownerId: validatedData.ownerId || session.user.id,
        createdBy: session.user.id,
        expectedCloseDate: validatedData.expectedCloseDate
          ? new Date(validatedData.expectedCloseDate)
          : null,
      },
      include: {
        customer: true,
        company: true,
        owner: true,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
```

---

### **Schritt 3: Dashboard Komponenten**

#### **3.1 Revenue Card Component** (`src/components/RevenueCard.tsx`)

```typescript
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
  const growth = previous ? ((current - previous) / previous) * 100 : 0;

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
        {previous !== undefined && (
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
```

---

#### **3.2 Pipeline Funnel Component** (`src/components/PipelineFunnel.tsx`)

```typescript
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
  const maxValue = Math.max(...stages.map(s => s.value));

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Sales Pipeline Funnel
      </h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;

          return (
            <div key={stage.stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {stage.stage.replace("_", " ")}
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
                  style={{ width: `${Math.max(widthPercent, 10)}%` }}
                >
                  {formatCurrency(stage.value)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### **Schritt 4: KPI Dashboard Page**

#### **4.1 Team KPI Dashboard** (Update `src/app/page.tsx` für Sales Lead)

```typescript
// Add this to the existing Dashboard for Sales Lead

"use client";

import { useEffect, useState } from "react";
import RevenueCard from "@/components/RevenueCard";
import PipelineFunnel from "@/components/PipelineFunnel";

// In the Sales Lead section of the dashboard:
const [teamKPIs, setTeamKPIs] = useState<any>(null);

useEffect(() => {
  if (isSalesLead(session)) {
    fetch("/api/kpis/team")
      .then(res => res.json())
      .then(data => setTeamKPIs(data))
      .catch(err => console.error("Error fetching KPIs:", err));
  }
}, [session]);

// Render KPI Cards
{teamKPIs && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <RevenueCard
        title="Monthly Revenue"
        current={teamKPIs.revenue.current}
        target={teamKPIs.revenue.target}
        previous={teamKPIs.revenue.previous}
        icon="💰"
      />
      <RevenueCard
        title="Quarterly Revenue"
        current={teamKPIs.revenue.quarterly}
        target={teamKPIs.revenue.quarterlyTarget}
        icon="📊"
      />
      <RevenueCard
        title="Yearly Revenue"
        current={teamKPIs.revenue.yearly}
        target={teamKPIs.revenue.yearlyTarget}
        icon="🎯"
      />
    </div>

    <PipelineFunnel stages={teamKPIs.dealsByStage} />
  </>
)}
```

---

## 📝 Weitere Komponenten

### **Leaderboard Component**

```typescript
// src/components/Leaderboard.tsx
interface TopPerformer {
  userId: string;
  name: string;
  revenue: number;
  dealsWon: number;
  conversionRate: number;
}

export default function Leaderboard({ performers }: { performers: TopPerformer[] }) {
  // Render top performers with medals, revenue, and conversion rates
}
```

### **Deals Table Component**

```typescript
// src/components/DealsTable.tsx
// Table with sortable columns, filters, and pagination
```

### **Revenue Chart Component**

```typescript
// src/components/RevenueChart.tsx
// Use recharts or chart.js for line chart showing 12-month revenue trend
```

---

## 🎯 Navigation Update

Add to `src/components/Sidebar.tsx`:

```typescript
const commonItems = [
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "Deals", href: "/deals", icon: "💼" }, // NEW
  { name: "Companies", href: "/companies", icon: "🏢" },
  // ... rest
];
```

---

## ✅ Testing Checklist

1. ☐ Test `/api/kpis/team` as Sales Lead
2. ☐ Test `/api/kpis/agent/[id]` as both roles
3. ☐ Test `/api/deals` CRUD operations
4. ☐ Verify KPI calculations are correct
5. ☐ Test Revenue Cards display correctly
6. ☐ Test Pipeline Funnel visualization
7. ☐ Test role-based access control

---

## 📊 Beispiel-Daten zum Testen

```bash
# Check deals in database
npx prisma studio

# Query deals via API
curl http://localhost:3000/api/deals

# Query team KPIs
curl http://localhost:3000/api/kpis/team

# Query agent KPIs
curl http://localhost:3000/api/kpis/agent/[agent-id]
```

---

## 🚀 Deployment Hinweise

1. **Datenbank Migration**: `npx prisma db push` (bereits erledigt)
2. **Seed Daten**: `npx tsx prisma/seed-deals.ts` (bereits erledigt)
3. **Environment Variables**: Keine neuen benötigt
4. **Build Test**: `npm run build` vor Deployment

---

## 💡 Erweiterungsmöglichkeiten

1. **Charts Library**: Installiere `recharts` für bessere Visualisierungen
2. **Export**: PDF/Excel Export für Reports
3. **Filters**: Erweiterte Filter für Deals (Datum, Wert, etc.)
4. **Notifications**: Alerts für stuck deals
5. **Forecasting**: ML-basierte Revenue Predictions

---

**Viel Erfolg bei der Implementierung! 🎉**

Bei Fragen kannst du dich jederzeit melden.

