import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Gleichmäßige Verteilung innerhalb der letzten 12 Monate
function dateInPastMonthsBucket(index: number, total: number) {
  const monthsSpan = 12;
  const bucket = Math.floor((index / total) * monthsSpan); // 0..11
  const now = new Date();
  const d = new Date(now);
  d.setMonth(now.getMonth() - (monthsSpan - 1 - bucket));
  d.setDate(randomInt(1, 28));
  d.setHours(randomInt(8, 18), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

async function main() {
  console.log("🌱 Seeding demo data with proper user names and emails…");

  // Clear all data first
  await prisma.dealNote.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.callNote.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.target.deleteMany({});
  await prisma.userCapacity.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});

  // Create Team first
  const team = await prisma.team.create({
    data: { name: "Sales Team", description: "Core sales team" },
  });

  // Create users with proper names and emails
  const userData = [
    {
      name: "Alexandra Müller",
      email: "alexandra.mueller@clarity.com",
      password: "$2b$10$JyE2GOLBaau04KAN8aGk5OPDJhkN25IrKlo1YD7XqA6VjaK7D.r2u", // lead123
      role: "SALES_LEAD",
      teamId: team.id,
      isActive: true,
    },
    {
      name: "Marcus Weber",
      email: "marcus.weber@clarity.com",
      password: "$2b$10$lhlkBrHOr5qGSMTzK3hgwuWxPLCRwK5CP706nZUQIdo4..h4tmu3u", // agent123
      role: "SALES_AGENT",
      teamId: team.id,
      isActive: true,
    },
    {
      name: "Sophie Schneider",
      email: "sophie.schneider@clarity.com",
      password: "$2b$10$lhlkBrHOr5qGSMTzK3hgwuWxPLCRwK5CP706nZUQIdo4..h4tmu3u", // agent123
      role: "SALES_AGENT",
      teamId: team.id,
      isActive: true,
    },
    {
      name: "Thomas Fischer",
      email: "thomas.fischer@clarity.com",
      password: "$2b$10$lhlkBrHOr5qGSMTzK3hgwuWxPLCRwK5CP706nZUQIdo4..h4tmu3u", // agent123
      role: "SALES_AGENT",
      teamId: team.id,
      isActive: true,
    },
    {
      name: "Sarah Thompson",
      email: "sarah.thompson@clarity.com",
      password: "$2b$10$lhlkBrHOr5qGSMTzK3hgwuWxPLCRwK5CP706nZUQIdo4..h4tmu3u", // agent123
      role: "SALES_LEAD",
      teamId: team.id,
      isActive: true,
    }
  ];

  const users = [];
  for (const user of userData) {
    const createdUser = await prisma.user.create({ data: user });
    users.push(createdUser);
  }

  const lead = users.find(u => u.role === "SALES_LEAD" && u.name !== "Sarah Thompson") ?? users[0];
  const agents = users.filter(u => u.id !== lead.id);
  const pickAgent = () => rand(agents).id;

  await prisma.userCapacity.createMany({
    data: users.map(u => ({
      userId: u.id,
      maxItemsPerWeek: u.role === "SALES_LEAD" ? 10 : 8,
      workingDays: "monday,tuesday,wednesday,thursday,friday",
      workingHoursStart: 9,
      workingHoursEnd: 17,
      isActive: true,
    })),
  });

  // Companies (10)
  const baseCompanies = [
    { name: "Siemens AG", industry: "TECHNOLOGY", size: "ENTERPRISE", city: "München", country: "Deutschland" },
    { name: "SAP SE", industry: "TECHNOLOGY", size: "ENTERPRISE", city: "Walldorf", country: "Deutschland" },
    { name: "BMW Group", industry: "AUTOMOTIVE", size: "ENTERPRISE", city: "München", country: "Deutschland" },
    { name: "CloudScale GmbH", industry: "TECHNOLOGY", size: "SMALL", city: "Hamburg", country: "Deutschland" },
    { name: "GreenEnergy Solutions", industry: "ENERGY", size: "MEDIUM", city: "Hamburg", country: "Deutschland" },
    { name: "MedTech Innovations", industry: "HEALTHCARE", size: "SMALL", city: "München", country: "Deutschland" },
    { name: "FinTech Dynamics", industry: "FINANCE", size: "STARTUP", city: "Frankfurt", country: "Deutschland" },
    { name: "AutoParts Manufacturing", industry: "MANUFACTURING", size: "MEDIUM", city: "Stuttgart", country: "Deutschland" },
    { name: "EduTech Solutions", industry: "EDUCATION", size: "SMALL", city: "Köln", country: "Deutschland" },
    { name: "RetailTech Pro", industry: "RETAIL", size: "MEDIUM", city: "Düsseldorf", country: "Deutschland" },
  ];

  const companies = await Promise.all(
    baseCompanies.map((c, i) =>
      prisma.company.create({
        data: {
          ...c,
          revenue: randomInt(1_000_000, 1_000_000_000),
          employees: randomInt(50, 5000),
          website: `https://www.${c.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
          phone: `+49 ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
          address: `${c.city}-Straße ${i + 1}`,
          status: "ACTIVE",
          foundedYear: randomInt(1970, 2022),
          assignedTo: pickAgent(),
          createdBy: lead.id,
        },
      })
    )
  );

  // Customers (100 = 10 pro Company), verteilt über 12 Monate
  const first = ["Anna","Ben","Chris","Diana","Erik","Flora","Gerd","Helen","Ivan","Julia","Kai","Lena","Marc","Nina","Olaf","Paula","Rico","Sara","Timo","Uwe"];
  const last = ["Müller","Schmidt","Fischer","Weber","Wagner","Becker","Schulz","Hoffmann","Klein","Wolf","Schäfer","Koch","Bauer","Richter","Schröder","Neumann"];
  const positions = ["CEO","CTO","VP Sales","Director","Manager"];
  const totalCustomers = 100;

  const customers = [] as Array<Awaited<ReturnType<typeof prisma.customer.create>>>;
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    for (let j = 0; j < 10; j++) {
      const idx = i * 10 + j;
      const createdAt = dateInPastMonthsBucket(idx, totalCustomers);
      const fn = rand(first), ln = rand(last);
      customers.push(await prisma.customer.create({
        data: {
          name: `${fn} ${ln}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${company.name.toLowerCase().replace(/[^a-z]/g,"")}.com`,
          phone: `+49 ${randomInt(100,999)} ${randomInt(1_000_000,9_999_999)}`,
          company: company.name,
          position: rand(positions),
          status: Math.random() < 0.6 ? "CUSTOMER" : "PROSPECT",
          source: rand(["WEBSITE","REFERRAL","COLD_CALL","SOCIAL_MEDIA"]),
          value: randomInt(10_000, 150_000),
          notes: Math.random() < 0.5 ? "Interested in enterprise plan" : null,
          assignedTo: pickAgent(),
          createdBy: lead.id,
          companyId: company.id,
          createdAt,
          updatedAt: createdAt,
        },
      }));
    }
  }

  // Deals (120 über 12 Monate + 50 in letzten 30 Tagen für bessere KPIs)
  const dealNames = ["CRM Implementation","Cloud Migration","Data Platform","Security Audit","ERP Upgrade","E‑commerce","DevOps Consulting"];
  const stages = ["PROSPECTING","QUALIFICATION","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST"];
  const totalDeals = 120;

  const deals = [] as Array<Awaited<ReturnType<typeof prisma.deal.create>>>;
  
  // Base deals über 12 Monate
  for (let i = 0; i < totalDeals; i++) {
    const company = rand(companies);
    const companyCustomers = customers.filter(c => c.companyId === company.id);
    const customer = companyCustomers.length ? rand(companyCustomers) : null;
    const stage = rand(stages);
    const createdAt = dateInPastMonthsBucket(i, totalDeals);
    const expectedCloseDate = new Date(createdAt.getTime() + randomInt(7, 120) * 24 * 60 * 60 * 1000);

    deals.push(await prisma.deal.create({
      data: {
        name: rand(dealNames),
        description: customer ? `Deal with ${customer.name} at ${company.name}` : `Deal at ${company.name}`,
        value: randomInt(20_000, 420_000),
        probability: randomInt(5, 100),
        stage,
        expectedCloseDate,
        actualCloseDate: ["CLOSED_WON","CLOSED_LOST"].includes(stage) ? expectedCloseDate : null,
        source: rand(["WEBSITE","REFERRAL","PARTNER","OUTBOUND"]),
        ownerId: pickAgent(),
        createdBy: lead.id,
        customerId: customer ? customer.id : null,
        companyId: company.id,
        createdAt,
        updatedAt: createdAt,
      },
    }));
  }

  // Extra deals für letzte 30 Tage (bessere KPI Visibility)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < 50; i++) {
    const company = rand(companies);
    const companyCustomers = customers.filter(c => c.companyId === company.id);
    const customer = companyCustomers.length ? rand(companyCustomers) : null;
    
    // Mehr CLOSED_WON/CLOSED_LOST für bessere Conversion Rate KPIs
    const stageWeighted = i < 15 ? "CLOSED_WON" : i < 25 ? "CLOSED_LOST" : rand(stages);
    
    // 60% der Deals in letzten 7 Tagen, 40% zwischen 7-30 Tagen
    const createdAt = new Date(
      i < 30 
        ? sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime())
        : thirtyDaysAgo.getTime() + Math.random() * (sevenDaysAgo.getTime() - thirtyDaysAgo.getTime())
    );
    
    const expectedCloseDate = new Date(createdAt.getTime() + randomInt(7, 60) * 24 * 60 * 60 * 1000);
    const isClosed = ["CLOSED_WON","CLOSED_LOST"].includes(stageWeighted);
    
    deals.push(await prisma.deal.create({
      data: {
        name: rand(dealNames),
        description: customer ? `Deal with ${customer.name} at ${company.name}` : `Deal at ${company.name}`,
        value: randomInt(15_000, 350_000),
        probability: stageWeighted === "CLOSED_WON" ? 100 : stageWeighted === "CLOSED_LOST" ? 0 : randomInt(20, 90),
        stage: stageWeighted,
        expectedCloseDate,
        actualCloseDate: isClosed ? new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000) : null,
        source: rand(["WEBSITE","REFERRAL","PARTNER","OUTBOUND"]),
        ownerId: pickAgent(),
        createdBy: lead.id,
        customerId: customer ? customer.id : null,
        companyId: company.id,
        createdAt,
        updatedAt: createdAt,
      },
    }));
  }

  // Deal Notes (80)
  for (let i = 0; i < Math.min(80, deals.length); i++) {
    const createdAt = dateInPastMonthsBucket(i, 80);
    await prisma.dealNote.create({
      data: {
        dealId: deals[i].id,
        content: "Qualification done. Next step: product demo.",
        userId: pickAgent(),
        createdAt,
      },
    });
  }

  // Activities (100 über 12 Monate + 40 in letzten 30 Tagen)
  for (let i = 0; i < 100; i++) {
    const c = rand(customers);
    const createdAt = dateInPastMonthsBucket(i, 100);
    await prisma.activity.create({
      data: {
        type: "CALL",
        title: `Intro call with ${c.name}`,
        description: `Discussed needs at ${c.company}`,
        duration: randomInt(15, 60),
        userId: pickAgent(),
        customerId: c.id,
        companyId: c.companyId!,
        plannedWeek: null,
        actualDate: createdAt,
        kanbanStatus: "COMPLETED",
        activityType: "CALL",
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // Extra activities für letzte 30 Tage
  for (let i = 0; i < 40; i++) {
    const c = rand(customers);
    const activityTypes = ["CALL", "MEETING", "EMAIL"];
    const type = rand(activityTypes);
    
    const createdAt = new Date(
      i < 25 
        ? sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime())
        : thirtyDaysAgo.getTime() + Math.random() * (sevenDaysAgo.getTime() - thirtyDaysAgo.getTime())
    );
    
    await prisma.activity.create({
      data: {
        type,
        title: `${type} with ${c.name}`,
        description: `Follow-up discussion at ${c.company}`,
        duration: randomInt(15, 90),
        userId: pickAgent(),
        customerId: c.id,
        companyId: c.companyId!,
        plannedWeek: null,
        actualDate: createdAt,
        kanbanStatus: Math.random() < 0.8 ? "COMPLETED" : "IN_PROGRESS",
        activityType: type,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // Tasks (100 über 12 Monate + 30 in letzten 30 Tagen)
  for (let i = 0; i < 100; i++) {
    const c = rand(customers);
    const createdAt = dateInPastMonthsBucket(i, 100);
    const dueDate = new Date(createdAt.getTime() + randomInt(1, 21) * 24 * 60 * 60 * 1000);
    const completed = Math.random() < 0.5;
    await prisma.task.create({
      data: {
        title: `Follow up ${c.name}`,
        description: `Send proposal to ${c.company}`,
        status: completed ? "COMPLETED" : rand(["TODO","IN_PROGRESS"]),
        priority: rand(["LOW","MEDIUM","HIGH"]),
        dueDate,
        actualEndDate: completed ? new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000) : null,
        assigneeId: pickAgent(),
        createdById: lead.id,
        teamId: team.id,
        customerId: c.id,
        companyId: c.companyId!,
        estimatedDuration: randomInt(20, 120),
        actualDuration: completed ? randomInt(20, 120) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // Extra tasks für letzte 30 Tage
  for (let i = 0; i < 30; i++) {
    const c = rand(customers);
    const createdAt = new Date(
      i < 20 
        ? sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime())
        : thirtyDaysAgo.getTime() + Math.random() * (sevenDaysAgo.getTime() - thirtyDaysAgo.getTime())
    );
    const dueDate = new Date(createdAt.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000);
    const completed = Math.random() < 0.7; // Höhere Completion Rate
    
    await prisma.task.create({
      data: {
        title: `${rand(["Call","Email","Demo","Meeting"])} with ${c.name}`,
        description: `${rand(["Follow-up on proposal","Schedule demo","Send pricing","Close deal"])} at ${c.company}`,
        status: completed ? "COMPLETED" : rand(["TODO","IN_PROGRESS"]),
        priority: rand(["LOW","MEDIUM","HIGH"]),
        dueDate,
        actualEndDate: completed ? new Date(createdAt.getTime() + randomInt(1, 10) * 24 * 60 * 60 * 1000) : null,
        assigneeId: pickAgent(),
        createdById: lead.id,
        teamId: team.id,
        customerId: c.id,
        companyId: c.companyId!,
        estimatedDuration: randomInt(30, 120),
        actualDuration: completed ? randomInt(30, 120) : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // Call Notes (100)
  for (let i = 0; i < 100; i++) {
    const c = rand(customers);
    const createdAt = dateInPastMonthsBucket(i, 100);
    await prisma.callNote.create({
      data: {
        clientName: c.name,
        clientCompany: c.company ?? "",
        phoneNumber: `+49 ${randomInt(100,999)} ${randomInt(1_000_000,9_999_999)}`,
        notes: "Asked for pricing and implementation timeline.",
        summary: "Discovery call",
        outcome: rand(["SUCCESSFUL","NO_ANSWER","CALLBACK_REQUESTED"]),
        followUpDate: new Date(createdAt.getTime() + randomInt(2, 10) * 24 * 60 * 60 * 1000),
        userId: pickAgent(),
        customerId: c.id,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  // Targets je User (aktueller Monat/Jahr)
  await prisma.target.createMany({
    data: users.map(u => ({
      userId: u.id,
      period: "MONTHLY",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      targetValue: u.role === "SALES_LEAD" ? 600000 : 300000,
      actualValue: 0,
    })),
  });

  console.log("✅ Seed complete.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

