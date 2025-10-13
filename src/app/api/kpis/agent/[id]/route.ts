import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";

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
    if (!isSalesLead(session) && session.user.id !== params.id) {
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

    const wonDeals = deals.filter((d) => d.stage === "CLOSED_WON");
    const lostDeals = deals.filter((d) => d.stage === "CLOSED_LOST");
    const activeDeals = deals.filter(
      (d) => !["CLOSED_WON", "CLOSED_LOST"].includes(d.stage)
    );

    // Monthly revenue
    const monthlyWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const monthlyRevenue = monthlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Previous month
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonthWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        d.actualCloseDate.getMonth() + 1 === prevMonth &&
        d.actualCloseDate.getFullYear() === prevYear
    );
    const prevMonthRevenue = prevMonthWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Quarterly revenue
    const quarterlyWonDeals = wonDeals.filter(
      (d) =>
        d.actualCloseDate &&
        Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
        d.actualCloseDate.getFullYear() === currentYear
    );
    const quarterlyRevenue = quarterlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Yearly revenue
    const yearlyWonDeals = wonDeals.filter(
      (d) => d.actualCloseDate && d.actualCloseDate.getFullYear() === currentYear
    );
    const yearlyRevenue = yearlyWonDeals.reduce((sum, d) => sum + d.value, 0);

    // Targets
    const monthlyTarget = targets.find((t) => t.period === "MONTHLY");
    const quarterlyTarget = targets.find((t) => t.period === "QUARTERLY");
    const yearlyTarget = targets.find((t) => t.period === "YEARLY");

    // Calculate rank
    const allAgentRevenues = await Promise.all(
      allUsers.map(async (u) => {
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
    const rank = sortedRevenues.findIndex((r) => r.userId === params.id) + 1;

    // Pipeline
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipelineValue = activeDeals.reduce(
      (sum, d) => sum + d.value * (d.probability / 100),
      0
    );
    const hotDeals = activeDeals.filter((d) => d.probability >= 70);

    // Performance
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;
    const avgDealSize =
      wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0;
    const avgDealCycle =
      wonDeals.filter((d) => d.totalDuration).length > 0
        ? wonDeals
            .filter((d) => d.totalDuration)
            .reduce((sum, d) => sum + (d.totalDuration || 0), 0) /
          wonDeals.filter((d) => d.totalDuration).length
        : 0;

    // Deals by stage
    const dealsByStage = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION"].map(
      (stage) => ({
        stage,
        count: deals.filter((d) => d.stage === stage).length,
        value: deals.filter((d) => d.stage === stage).reduce((sum, d) => sum + d.value, 0),
      })
    );

    // Upcoming
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dealsClosingThisWeek = activeDeals.filter(
      (d) => d.expectedCloseDate && d.expectedCloseDate >= today && d.expectedCloseDate <= nextWeek
    );

    // Get customer stats
    const customers = await prisma.customer.findMany({
      where: { assignedTo: params.id },
    });

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
        quarterly: quarterlyRevenue,
        quarterlyTarget: quarterlyTarget?.targetValue || 0,
        yearly: yearlyRevenue,
        yearlyTarget: yearlyTarget?.targetValue || 0,
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
      customers: {
        total: customers.length,
        active: customers.filter((c) => c.status === "CUSTOMER").length,
        prospects: customers.filter((c) => c.status === "PROSPECT").length,
        leads: customers.filter((c) => c.status === "LEAD").length,
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

