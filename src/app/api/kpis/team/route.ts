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
    const wonDeals = allDeals.filter((d) => d.stage === "CLOSED_WON");
    const lostDeals = allDeals.filter((d) => d.stage === "CLOSED_LOST");
    const activeDeals = allDeals.filter(
      (d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    // Monthly revenue
    const monthlyWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const currentMonthRevenue = monthlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Previous month for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === prevMonth &&
        d.actualCloseDate.getFullYear() === prevYear
    );
    const previousMonthRevenue = prevMonthWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Quarterly revenue
    const quarterlyWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const currentQuarterRevenue = quarterlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Yearly revenue
    const yearlyWonDeals = wonDeals.filter(
      (d) => d.actualCloseDate && d.actualCloseDate.getFullYear() === currentYear
    );
    const currentYearRevenue = yearlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Get targets
    const monthlyTarget = targets.find((t) => t.period === "MONTHLY" && !t.userId);
    const quarterlyTarget = targets.find((t) => t.period === "QUARTERLY" && !t.userId);
    const yearlyTarget = targets.find((t) => t.period === "YEARLY" && !t.userId);

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
    ].map((stage) => {
      const stageDeals = allDeals.filter((d) => d.stage === stage);
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
    const topPerformers = users.map((user) => {
      const userWonDeals = wonDeals.filter((d) => d.ownerId === user.id);
      const userLostDeals = lostDeals.filter((d) => d.ownerId === user.id);
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
      wonDeals.filter((d) => d.totalDuration).length > 0
        ? wonDeals
            .filter((d) => d.totalDuration)
            .reduce((sum, d) => sum + (d.totalDuration || 0), 0) /
          wonDeals.filter((d) => d.totalDuration).length
        : 0;

    // Forecast (next 90 days)
    const upcomingDeals = activeDeals.filter(
      (d) =>
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

