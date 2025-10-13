import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  // Hash passwords for demo users
  const leadPassword = await bcrypt.hash("lead123", 10);
  const agentPassword = await bcrypt.hash("agent123", 10);

  // Create users
  const salesLead = await prisma.user.upsert({
    where: { email: "lead@clarity.com" },
    update: {},
    create: {
      email: "lead@clarity.com",
      name: "Sarah Thompson",
      password: leadPassword,
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
      password: agentPassword,
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
      password: agentPassword,
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
      password: agentPassword,
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

  // Create customers
  const customerSources = ["WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"];
  const customerStatuses = ["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE"];
  const companies = [
    "TechCorp GmbH", "Innovate Solutions", "Digital Dynamics", "Future Systems", "Smart Technologies",
    "Cloud Innovations", "Data Analytics Inc", "Software Solutions", "IT Consulting Group", "TechStart AG",
    "Business Intelligence Ltd", "Digital Transformation Co", "Enterprise Software", "Cyber Security Pro", "AI Solutions",
    "Blockchain Technologies", "Mobile Development", "Web Services AG", "Database Systems", "Network Solutions",
    "Automation Experts", "Machine Learning Corp", "IoT Innovations", "Cloud Computing Ltd", "DevOps Solutions",
    "API Development", "Microservices AG", "Container Technologies", "Serverless Solutions", "Edge Computing",
    "Quantum Technologies", "AR/VR Solutions", "Gaming Studios", "E-commerce Platforms", "Fintech Solutions",
    "HealthTech Innovations", "EdTech Solutions", "GreenTech AG", "CleanTech Ltd", "BioTech Corp",
    "Space Technologies", "Robotics Solutions", "Automotive Tech", "Energy Solutions", "Manufacturing 4.0",
    "Supply Chain Tech", "Logistics Solutions", "Retail Technology", "Marketing Automation", "SalesTech Pro"
  ];
  
  const positions = [
    "CEO", "CTO", "CFO", "VP Sales", "VP Marketing", "VP Engineering", "Head of Product", "Sales Director",
    "Marketing Director", "Engineering Manager", "Product Manager", "Business Development", "Account Manager",
    "Sales Manager", "Marketing Manager", "Project Manager", "Technical Lead", "Software Architect", "DevOps Engineer",
    "Data Scientist", "UX Designer", "Business Analyst", "Operations Manager", "Finance Manager", "HR Manager"
  ];

  const firstNames = [
    "Alexander", "Benjamin", "Christian", "Daniel", "Erik", "Florian", "Gabriel", "Henrik", "Igor", "Jakob",
    "Klaus", "Lukas", "Markus", "Niklas", "Oliver", "Patrick", "Quentin", "Robert", "Sebastian", "Thomas",
    "Ulrich", "Vincent", "Wolfgang", "Xavier", "Yannick", "Zacharias", "Anna", "Barbara", "Claudia", "Diana",
    "Elena", "Franziska", "Gabriele", "Helena", "Isabella", "Julia", "Katharina", "Laura", "Maria", "Nina",
    "Olivia", "Patricia", "Rachel", "Sandra", "Tanja", "Ulrike", "Veronika", "Wendy", "Xenia", "Yvonne", "Zoe"
  ];

  const lastNames = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier", "Lehmann",
    "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber", "Kaiser",
    "Fuchs", "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Schwarz"
  ];

  const customers = [];
  
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const source = customerSources[Math.floor(Math.random() * customerSources.length)];
    const status = customerStatuses[Math.floor(Math.random() * customerStatuses.length)];
    const assignedUser = Math.random() > 0.3 ? [agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 3)] : null;
    const value = status === "CUSTOMER" ? Math.floor(Math.random() * 100000) + 10000 : (Math.random() > 0.7 ? Math.floor(Math.random() * 50000) + 5000 : null);

    customers.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}`,
      company: company,
      position: position,
      status: status,
      source: source,
      value: value,
      notes: Math.random() > 0.5 ? `Interested in ${Math.random() > 0.5 ? 'enterprise' : 'standard'} solution. ${Math.random() > 0.5 ? 'Budget approved.' : 'Needs approval.'}` : null,
      assignedTo: assignedUser,
      createdBy: [salesLead.id, agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 4)],
    });
  }

  await prisma.customer.createMany({
    data: customers,
  });

  console.log(`✅ Created ${customers.length} customers`);

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

