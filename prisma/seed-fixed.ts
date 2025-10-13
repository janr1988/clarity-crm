import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const salesLead = await prisma.user.create({
    data: {
      name: "Sarah Johnson",
      email: "lead@clarity.com",
      password: await bcrypt.hash("lead123", 10),
      role: "SALES_LEAD",
      isActive: true,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      name: "John Smith",
      email: "john@clarity.com",
      password: await bcrypt.hash("agent123", 10),
      role: "SALES_AGENT",
      isActive: true,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: "Emily Davis",
      email: "emily@clarity.com",
      password: await bcrypt.hash("agent123", 10),
      role: "SALES_AGENT",
      isActive: true,
    },
  });

  const agent3 = await prisma.user.create({
    data: {
      name: "Mike Wilson",
      email: "mike@clarity.com",
      password: await bcrypt.hash("agent123", 10),
      role: "SALES_AGENT",
      isActive: true,
    },
  });

  // Create team
  const salesTeam = await prisma.team.create({
    data: {
      name: "Sales Team",
      description: "Main sales team",
    },
  });

  // Create companies FIRST (30 companies)
  const companyNames = [
    "Siemens AG", "BMW Group", "SAP SE", "Deutsche Bank", "Volkswagen AG",
    "BASF SE", "Bayer AG", "Allianz SE", "Daimler AG", "Lufthansa Group",
    "Deutsche Telekom", "Adidas AG", "Henkel AG", "Continental AG", "Fresenius SE",
    "RWE AG", "E.ON SE", "ThyssenKrupp AG", "Infineon Technologies", "Beiersdorf AG",
    "Covestro AG", "Symrise AG", "GEA Group", "Krones AG", "Siltronic AG",
    "Fuchs Petrolub", "Software AG", "TeamViewer AG", "Delivery Hero SE", "HelloFresh SE"
  ];

  const industries = [
    "TECHNOLOGY", "FINANCE", "HEALTHCARE", "MANUFACTURING", "RETAIL",
    "EDUCATION", "ENERGY", "AUTOMOTIVE", "AEROSPACE", "CONSTRUCTION",
    "FOOD_BEVERAGE", "PHARMACEUTICALS", "TELECOMMUNICATIONS", "MEDIA", "TRANSPORTATION"
  ];

  const sizes = ["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
  const statuses = ["ACTIVE", "PROSPECT", "PARTNER", "INACTIVE"];
  const countries = ["Germany", "Austria", "Switzerland", "Netherlands", "France"];
  const cities = ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"];

  const companies = [];
  
  for (let i = 0; i < 30; i++) {
    const name = companyNames[i];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const country = countries[Math.floor(Math.random() * countries.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    const revenue = Math.floor(Math.random() * 5000000000) + 1000000; // 1M to 5B
    const employees = Math.floor(Math.random() * 10000) + 10; // 10 to 10K employees
    const foundedYear = Math.floor(Math.random() * 50) + 1970; // 1970 to 2020
    
    const assignedUser = Math.random() > 0.3 ? [salesLead.id, agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 4)] : null;

    companies.push({
      name: name,
      industry: industry,
      size: size,
      revenue: revenue,
      employees: employees,
      website: `https://www.${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      address: `${Math.floor(Math.random() * 999) + 1} ${city} Street`,
      city: city,
      country: country,
      phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      description: `${name} is a leading company in ${industry.toLowerCase()} with ${employees} employees.`,
      status: status,
      foundedYear: foundedYear,
      lastContact: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
      assignedTo: assignedUser,
      createdBy: [salesLead.id, agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 4)],
    });
  }

  await prisma.company.createMany({
    data: companies,
  });

  console.log(`✅ Created ${companies.length} companies`);

  // Now get the created companies for customer assignment
  const allCompanies = await prisma.company.findMany();
  const companyIds = allCompanies.map(c => c.id);
  
  console.log(`Found ${allCompanies.length} companies for customer assignment`);

  // Create customers (100 customers assigned to companies)
  const customerSources = ["WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"];
  
  const positions = [
    "CEO", "CTO", "CFO", "VP Sales", "VP Marketing", "VP Engineering", "Head of Product", "Sales Director",
    "Marketing Director", "Engineering Manager", "Product Manager", "Business Development Manager", "Account Manager",
    "Sales Manager", "Marketing Manager", "Project Manager", "Technical Lead", "Software Architect", "DevOps Engineer",
    "Data Scientist", "UX Designer", "Business Analyst", "Operations Manager", "Finance Manager", "HR Manager",
    "Chief Innovation Officer", "Head of Strategy", "Regional Sales Manager", "Key Account Manager", "Solution Architect",
    "Product Owner", "Scrum Master", "Quality Assurance Manager", "Customer Success Manager", "Partnership Manager"
  ];

  const firstNames = [
    "Alexander", "Benjamin", "Christian", "Daniel", "Erik", "Florian", "Gabriel", "Henrik", "Igor", "Jakob",
    "Klaus", "Lukas", "Markus", "Niklas", "Oliver", "Patrick", "Quentin", "Robert", "Sebastian", "Thomas",
    "Ulrich", "Vincent", "Wolfgang", "Xavier", "Yannick", "Zacharias", "Anna", "Barbara", "Claudia", "Diana",
    "Elena", "Franziska", "Gabriele", "Helena", "Isabella", "Julia", "Katharina", "Laura", "Maria", "Nina",
    "Olivia", "Patricia", "Rachel", "Sandra", "Tanja", "Ulrike", "Veronika", "Wendy", "Xenia", "Yvonne", "Zoe",
    "Michael", "Stefan", "Andreas", "Martin", "Jürgen", "Hans", "Peter", "Klaus", "Wolfgang", "Josef",
    "Franz", "Anton", "Johann", "Karl", "Josef", "Franz", "Anton", "Johann", "Karl", "Josef",
    "Sabine", "Monika", "Petra", "Birgit", "Andrea", "Susanne", "Ingrid", "Ursula", "Elisabeth", "Gisela"
  ];

  const lastNames = [
    "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
    "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
    "Braun", "Krüger", "Hofmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier", "Lehmann",
    "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber", "Kaiser",
    "Fuchs", "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Schwarz",
    "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann"
  ];

  const customers = [];
  
  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    const source = customerSources[Math.floor(Math.random() * customerSources.length)];
    
    // Weighted status distribution (more customers than leads)
    const statusWeights = [0.15, 0.25, 0.50, 0.10]; // LEAD, PROSPECT, CUSTOMER, INACTIVE
    const random = Math.random();
    let status = "CUSTOMER";
    if (random < statusWeights[0]) status = "LEAD";
    else if (random < statusWeights[0] + statusWeights[1]) status = "PROSPECT";
    else if (random < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = "CUSTOMER";
    else status = "INACTIVE";
    
    const assignedUser = Math.random() > 0.2 ? [agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 3)] : null;
    
    // Value based on status and position
    let value = null;
    if (status === "CUSTOMER" || status === "PROSPECT") {
      const baseValue = position.includes("CEO") || position.includes("CFO") ? 100000 : 
                       position.includes("Director") || position.includes("VP") ? 75000 :
                       position.includes("Manager") ? 50000 : 25000;
      value = Math.floor(Math.random() * baseValue * 2) + baseValue;
    }
    
    // Assign to random company
    const assignedCompanyId = companyIds[Math.floor(Math.random() * companyIds.length)];
    const assignedCompany = allCompanies.find(c => c.id === assignedCompanyId);
    
    if (i < 3) { // Debug first 3 customers
      console.log(`Customer ${i}: assignedCompanyId=${assignedCompanyId}, assignedCompany=${assignedCompany?.name}`);
    }

    const notes = [
      `Interested in ${Math.random() > 0.5 ? 'enterprise' : 'standard'} solution.`,
      `Budget ${Math.random() > 0.5 ? 'approved' : 'pending approval'}.`,
      `Decision maker: ${Math.random() > 0.5 ? 'Yes' : 'No'}.`,
      `Timeline: ${Math.random() > 0.5 ? 'Q1 2024' : 'Q2 2024'}.`,
      `Priority: ${Math.random() > 0.5 ? 'High' : 'Medium'}.`,
      `Previous customer: ${Math.random() > 0.3 ? 'Yes' : 'No'}.`,
      `Competition: ${Math.random() > 0.5 ? 'None' : 'Multiple vendors'}.`,
      `Technical requirements: ${Math.random() > 0.5 ? 'Standard' : 'Custom'}.`
    ].filter(() => Math.random() > 0.5).join(" ");

    customers.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${assignedCompany?.name.toLowerCase().replace(/[^a-z]/g, '') || 'company'}.com`,
      phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}${Math.floor(Math.random() * 9000) + 1000}`,
      company: assignedCompany?.name || "Unknown Company",
      position: position,
      status: status,
      source: source,
      value: value,
      notes: notes || null,
      assignedTo: assignedUser,
      createdBy: [salesLead.id, agent1.id, agent2.id, agent3.id][Math.floor(Math.random() * 4)],
      companyId: assignedCompanyId,
    });
  }

  await prisma.customer.createMany({
    data: customers,
  });

  console.log(`✅ Created ${customers.length} customers assigned to companies`);

  // Create tasks
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
        teamId: salesTeam.id,
      },
      {
        type: "EMAIL",
        title: "Follow-up email to TechStart",
        description: "Sent product information and pricing",
        userId: agent2.id,
        teamId: salesTeam.id,
      },
      {
        type: "MEETING",
        title: "Demo presentation to GlobalTech",
        description: "Product demonstration and Q&A session",
        duration: 90,
        userId: agent1.id,
        teamId: salesTeam.id,
      },
    ],
  });

  // Create call notes
  await prisma.callNote.createMany({
    data: [
      {
        clientName: "Acme Corp",
        clientCompany: "Acme Corporation",
        phoneNumber: "+1-555-0123",
        notes:
          "Initial discovery call. Company has 200 employees, looking for CRM solution. Timeline: 3 months. Budget: $50k-75k annually. Decision maker: CEO John Smith.",
        summary: "Discovery call - 200 employees, 3 month timeline, $50-75k budget, CEO decision maker",
        outcome: "Demo scheduled",
        followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        userId: agent1.id,
      },
      {
        clientName: "TechStart Inc",
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
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
