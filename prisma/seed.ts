import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create teams
  const salesTeam = await prisma.team.upsert({
    where: { id: "team-1" },
    update: {},
    create: {
      id: "team-1",
      name: "Sales Team",
      description: "Main sales team",
    },
  });

  // Create users
  const salesLead = await prisma.user.upsert({
    where: { email: "lead@clarity.com" },
    update: {},
    create: {
      email: "lead@clarity.com",
      name: "Sarah Thompson",
      role: "SALES_LEAD",
      teamId: salesTeam.id,
      isActive: true,
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: "john@clarity.com" },
    update: {},
    create: {
      email: "john@clarity.com",
      name: "John Davis",
      role: "SALES_AGENT",
      teamId: salesTeam.id,
      isActive: true,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: "emma@clarity.com" },
    update: {},
    create: {
      email: "emma@clarity.com",
      name: "Emma Wilson",
      role: "SALES_AGENT",
      teamId: salesTeam.id,
      isActive: true,
    },
  });

  const agent3 = await prisma.user.upsert({
    where: { email: "mike@clarity.com" },
    update: {},
    create: {
      email: "mike@clarity.com",
      name: "Mike Chen",
      role: "SALES_AGENT",
      teamId: salesTeam.id,
      isActive: true,
    },
  });

  // Create some tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Follow up with Acme Corp",
        description: "Discuss Q4 contract renewal",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assigneeId: agent1.id,
        createdById: salesLead.id,
        teamId: salesTeam.id,
      },
      {
        title: "Prepare demo for TechStart",
        description: "Product demonstration scheduled for next week",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assigneeId: agent2.id,
        createdById: salesLead.id,
        teamId: salesTeam.id,
      },
      {
        title: "Send proposal to GlobalTech",
        description: "Enterprise pricing proposal",
        status: "COMPLETED",
        priority: "HIGH",
        assigneeId: agent1.id,
        createdById: salesLead.id,
        teamId: salesTeam.id,
      },
      {
        title: "Research new leads in fintech",
        description: "Identify 10 potential clients",
        status: "TODO",
        priority: "LOW",
        assigneeId: agent3.id,
        createdById: salesLead.id,
        teamId: salesTeam.id,
      },
    ],
  });

  // Create activities
  await prisma.activity.createMany({
    data: [
      {
        type: "CALL",
        title: "Call with Acme Corp - CEO",
        description: "Discussed product features and pricing",
        duration: 45,
        userId: agent1.id,
      },
      {
        type: "MEETING",
        title: "Team sync meeting",
        description: "Weekly team alignment",
        duration: 60,
        userId: agent2.id,
      },
      {
        type: "EMAIL",
        title: "Follow-up email to TechStart",
        description: "Sent demo materials and pricing info",
        userId: agent2.id,
      },
      {
        type: "CALL",
        title: "Discovery call with StartupXYZ",
        description: "Initial needs assessment",
        duration: 30,
        userId: agent3.id,
      },
    ],
  });

  // Create call notes
  await prisma.callNote.createMany({
    data: [
      {
        clientName: "Robert Johnson",
        clientCompany: "Acme Corp",
        phoneNumber: "+1-555-0123",
        notes:
          "Discussed Q4 renewal. Client is happy with service but wants 15% discount. Mentioned budget constraints. Interested in new analytics feature.",
        summary: "Renewal discussion - wants discount, interested in analytics",
        outcome: "Follow-up scheduled",
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        userId: agent1.id,
      },
      {
        clientName: "Lisa Chen",
        clientCompany: "TechStart Inc",
        phoneNumber: "+1-555-0456",
        notes:
          "Initial discovery call. Company has 50 employees, looking for CRM solution. Timeline: 2 months. Budget: $10k-15k annually.",
        summary: "Discovery - 50 employees, 2 month timeline, $10-15k budget",
        outcome: "Demo scheduled",
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: agent2.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

