import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Sales Lead can view team KPIs
    if (!isSalesLead(session)) {
      return NextResponse.json(
        { error: "Forbidden: Only Sales Leads can view team KPIs" },
        { status: 403 }
      );
    }

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

    // Top performers
    const topPerformers = users.map((user) => {
      const userWonDeals = wonDeals.filter((d) => d.ownerId === user.id);
      const userTotalDeals = deals.filter((d) => d.ownerId === user.id);
      const userRevenue = userWonDeals.reduce((sum, d) => sum + d.value, 0);
      const userConversionRate =
        userTotalDeals.length > 0 ? (userWonDeals.length / userTotalDeals.length) * 100 : 0;
      const userAvgDealSize = userWonDeals.length > 0 ? userRevenue / userWonDeals.length : 0;

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        revenue: userRevenue,
        dealsWon: userWonDeals.length,
        dealsLost: userTotalDeals.filter((d) => d.stage === "CLOSED_LOST").length,
        conversionRate: parseFloat(userConversionRate.toFixed(2)),
        avgDealSize: parseFloat(userAvgDealSize.toFixed(2)),
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Build response
    const kpis = {
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

    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Error fetching team KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch team KPIs" },
      { status: 500 }
    );
  }
}