import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎯 Seeding Deals and Targets...");

  // Get existing users, customers, and companies
  const users = await prisma.user.findMany();
  const customers = await prisma.customer.findMany();
  const companies = await prisma.company.findMany();

  if (users.length === 0 || customers.length === 0 || companies.length === 0) {
    console.error("❌ Please run the main seed script first!");
    return;
  }

  const salesLead = users.find(u => u.role === "SALES_LEAD");
  const agents = users.filter(u => u.role === "SALES_AGENT");

  if (!salesLead || agents.length === 0) {
    console.error("❌ No sales lead or agents found!");
    return;
  }

  // Deal stages with probabilities
  const dealStages = [
    { stage: "PROSPECTING", probability: 20 },
    { stage: "QUALIFICATION", probability: 40 },
    { stage: "PROPOSAL", probability: 60 },
    { stage: "NEGOTIATION", probability: 80 },
    { stage: "CLOSED_WON", probability: 100 },
    { stage: "CLOSED_LOST", probability: 0 },
  ];

  const dealSources = [
    "WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", 
    "TRADE_SHOW", "PARTNER", "INBOUND", "OUTBOUND"
  ];

  const lostReasons = [
    "Price too high",
    "Chose competitor",
    "No budget",
    "Timing not right",
    "No decision maker access",
    "Requirements not met",
    "Lost contact"
  ];

  // Create 250 deals (mix of historical and current)
  const deals = [];
  const dealNotes = [];
  
  for (let i = 0; i < 250; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const company = companies.find(c => c.id === customer.companyId) || companies[0];
    const owner = agents[Math.floor(Math.random() * agents.length)];
    const creator = Math.random() > 0.3 ? owner : salesLead;

    // Determine if this is a historical deal (closed) or current deal
    const isHistorical = i < 150; // 150 historical, 100 current
    
    let stage: string;
    let probability: number;
    let actualCloseDate: Date | null = null;
    let expectedCloseDate: Date;
    
    if (isHistorical) {
      // Historical deals are either WON or LOST
      const isWon = Math.random() > 0.35; // 65% win rate for historical
      stage = isWon ? "CLOSED_WON" : "CLOSED_LOST";
      probability = isWon ? 100 : 0;
      
      // Close date in the past (last 12 months)
      const daysAgo = Math.floor(Math.random() * 365);
      actualCloseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      expectedCloseDate = actualCloseDate;
    } else {
      // Current deals in various stages
      const stageData = dealStages[Math.floor(Math.random() * (dealStages.length - 2))]; // Exclude CLOSED
      stage = stageData.stage;
      probability = stageData.probability + Math.floor(Math.random() * 20) - 10; // +/- 10%
      probability = Math.max(0, Math.min(100, probability));
      
      // Expected close date in the future (next 90 days)
      const daysAhead = Math.floor(Math.random() * 90) + 1;
      expectedCloseDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    }

    // Deal value based on company size
    let baseValue: number;
    switch (company.size) {
      case "STARTUP":
        baseValue = 5000 + Math.random() * 20000;
        break;
      case "SMALL":
        baseValue = 25000 + Math.random() * 50000;
        break;
      case "MEDIUM":
        baseValue = 75000 + Math.random() * 175000;
        break;
      case "LARGE":
        baseValue = 250000 + Math.random() * 500000;
        break;
      case "ENTERPRISE":
        baseValue = 750000 + Math.random() * 1250000;
        break;
      default:
        baseValue = 50000 + Math.random() * 100000;
    }

    const value = Math.round(baseValue);

    // Calculate days in stage and total duration
    const createdDate = isHistorical 
      ? new Date(actualCloseDate!.getTime() - (30 + Math.random() * 60) * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);
    
    const daysInStage = Math.floor((Date.now() - createdDate.getTime()) / (24 * 60 * 60 * 1000));
    const totalDuration = actualCloseDate 
      ? Math.floor((actualCloseDate.getTime() - createdDate.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    const source = dealSources[Math.floor(Math.random() * dealSources.length)];
    
    const dealName = `${company.name} - ${customer.position || 'Contact'} - ${stage.replace('_', ' ')}`;

    const deal = {
      id: undefined as any, // Will be set after creation
      name: dealName,
      customerId: customer.id,
      companyId: company.id,
      value,
      probability,
      stage,
      expectedCloseDate,
      actualCloseDate,
      source,
      description: `${company.industry || 'Business'} solution for ${company.name}. Deal size: €${value.toLocaleString()}`,
      lostReason: stage === "CLOSED_LOST" ? lostReasons[Math.floor(Math.random() * lostReasons.length)] : null,
      daysInStage,
      totalDuration,
      ownerId: owner.id,
      createdBy: creator.id,
      createdAt: createdDate,
      updatedAt: new Date(),
    };

    deals.push(deal);
  }

  // Create deals in batches
  console.log(`Creating ${deals.length} deals...`);
  const createdDeals = [];
  for (const dealData of deals) {
    const created = await prisma.deal.create({
      data: dealData,
    });
    createdDeals.push(created);
  }

  console.log(`✅ Created ${createdDeals.length} deals`);

  // Create deal notes for some deals
  console.log("Creating deal notes...");
  const noteTemplates = [
    "Initial contact made, customer interested in our solution",
    "Sent proposal document, awaiting feedback",
    "Had discovery call, identified key pain points",
    "Pricing discussion, customer requested discount",
    "Demo scheduled for next week",
    "Contract sent for review",
    "Negotiating terms and conditions",
    "Customer requested additional features",
    "Waiting for budget approval",
    "Decision maker meeting scheduled",
    "Competitor comparison requested",
    "Technical evaluation in progress",
    "Legal review underway",
    "Final approval pending",
    "Deal closed successfully!",
    "Customer went with competitor",
    "Budget constraints, deal postponed",
  ];

  for (const deal of createdDeals.slice(0, 100)) { // Add notes to 100 deals
    const noteCount = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < noteCount; i++) {
      const note = noteTemplates[Math.floor(Math.random() * noteTemplates.length)];
      await prisma.dealNote.create({
        data: {
          dealId: deal.id,
          content: note,
          userId: deal.ownerId,
          createdAt: new Date(deal.createdAt.getTime() + i * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created deal notes");

  // Create targets for each agent (monthly, quarterly, yearly)
  console.log("Creating revenue targets...");
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  for (const agent of agents) {
    // Monthly target for current month
    await prisma.target.create({
      data: {
        userId: agent.id,
        period: "MONTHLY",
        year: currentYear,
        month: currentMonth,
        targetValue: 75000 + Math.random() * 75000, // €75K - €150K
        actualValue: 0, // Will be calculated
      },
    });

    // Quarterly target for current quarter
    await prisma.target.create({
      data: {
        userId: agent.id,
        period: "QUARTERLY",
        year: currentYear,
        quarter: currentQuarter,
        targetValue: 225000 + Math.random() * 225000, // €225K - €450K
        actualValue: 0,
      },
    });

    // Yearly target
    await prisma.target.create({
      data: {
        userId: agent.id,
        period: "YEARLY",
        year: currentYear,
        targetValue: 900000 + Math.random() * 900000, // €900K - €1.8M
        actualValue: 0,
      },
    });
  }

  // Team targets
  await prisma.target.create({
    data: {
      userId: null, // Team target
      period: "MONTHLY",
      year: currentYear,
      month: currentMonth,
      targetValue: 300000,
      actualValue: 0,
    },
  });

  await prisma.target.create({
    data: {
      userId: null,
      period: "QUARTERLY",
      year: currentYear,
      quarter: currentQuarter,
      targetValue: 900000,
      actualValue: 0,
    },
  });

  await prisma.target.create({
    data: {
      userId: null,
      period: "YEARLY",
      year: currentYear,
      targetValue: 3600000,
      actualValue: 0,
    },
  });

  console.log("✅ Created revenue targets");

  // Calculate actual values for targets based on closed deals
  console.log("Calculating actual revenue...");
  
  const wonDeals = await prisma.deal.findMany({
    where: { stage: "CLOSED_WON" },
    include: { owner: true },
  });

  for (const agent of agents) {
    const agentWonDeals = wonDeals.filter(d => d.ownerId === agent.id);
    
    // Monthly
    const monthlyRevenue = agentWonDeals
      .filter(d => d.actualCloseDate && 
        d.actualCloseDate.getMonth() + 1 === currentMonth &&
        d.actualCloseDate.getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.value, 0);
    
    await prisma.target.updateMany({
      where: {
        userId: agent.id,
        period: "MONTHLY",
        year: currentYear,
        month: currentMonth,
      },
      data: { actualValue: monthlyRevenue },
    });

    // Quarterly
    const quarterlyRevenue = agentWonDeals
      .filter(d => d.actualCloseDate && 
        Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
        d.actualCloseDate.getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.value, 0);
    
    await prisma.target.updateMany({
      where: {
        userId: agent.id,
        period: "QUARTERLY",
        year: currentYear,
        quarter: currentQuarter,
      },
      data: { actualValue: quarterlyRevenue },
    });

    // Yearly
    const yearlyRevenue = agentWonDeals
      .filter(d => d.actualCloseDate && d.actualCloseDate.getFullYear() === currentYear)
      .reduce((sum, d) => sum + d.value, 0);
    
    await prisma.target.updateMany({
      where: {
        userId: agent.id,
        period: "YEARLY",
        year: currentYear,
      },
      data: { actualValue: yearlyRevenue },
    });
  }

  // Team totals
  const teamMonthlyRevenue = wonDeals
    .filter(d => d.actualCloseDate && 
      d.actualCloseDate.getMonth() + 1 === currentMonth &&
      d.actualCloseDate.getFullYear() === currentYear)
    .reduce((sum, d) => sum + d.value, 0);

  await prisma.target.updateMany({
    where: {
      userId: null,
      period: "MONTHLY",
      year: currentYear,
      month: currentMonth,
    },
    data: { actualValue: teamMonthlyRevenue },
  });

  const teamQuarterlyRevenue = wonDeals
    .filter(d => d.actualCloseDate && 
      Math.ceil((d.actualCloseDate.getMonth() + 1) / 3) === currentQuarter &&
      d.actualCloseDate.getFullYear() === currentYear)
    .reduce((sum, d) => sum + d.value, 0);

  await prisma.target.updateMany({
    where: {
      userId: null,
      period: "QUARTERLY",
      year: currentYear,
      quarter: currentQuarter,
    },
    data: { actualValue: teamQuarterlyRevenue },
  });

  const teamYearlyRevenue = wonDeals
    .filter(d => d.actualCloseDate && d.actualCloseDate.getFullYear() === currentYear)
    .reduce((sum, d) => sum + d.value, 0);

  await prisma.target.updateMany({
    where: {
      userId: null,
      period: "YEARLY",
      year: currentYear,
    },
    data: { actualValue: teamYearlyRevenue },
  });

  console.log("✅ Calculated actual revenue");

  console.log("\n📊 Summary:");
  console.log(`- Created ${createdDeals.length} deals`);
  console.log(`- Won deals: ${wonDeals.length}`);
  console.log(`- Team revenue (YTD): €${teamYearlyRevenue.toLocaleString()}`);
  console.log(`- Created ${agents.length * 3 + 3} targets`);
  console.log("\n✅ Deals and Targets seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

