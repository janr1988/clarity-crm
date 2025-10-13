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

  // Create customers (100 new customers assigned to companies)
  const customerSources = ["WEBSITE", "REFERRAL", "COLD_CALL", "SOCIAL_MEDIA", "TRADE_SHOW", "OTHER"];
  const customerStatuses = ["LEAD", "PROSPECT", "CUSTOMER", "INACTIVE"];
  
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

  // Get all companies for assignment
  const allCompanies = await prisma.company.findMany();
  const companyIds = allCompanies.map(c => c.id);

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

  // Create companies
  const industries = [
    "TECHNOLOGY", "FINANCE", "HEALTHCARE", "MANUFACTURING", "RETAIL", 
    "EDUCATION", "ENERGY", "AUTOMOTIVE", "AEROSPACE", "CONSTRUCTION",
    "FOOD_BEVERAGE", "PHARMACEUTICALS", "TELECOMMUNICATIONS", "MEDIA", "TRANSPORTATION"
  ];
  
  const companySizes = ["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"];
  const companyStatuses = ["ACTIVE", "PROSPECT", "PARTNER", "INACTIVE"];
  
  const cities = [
    "München", "Berlin", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", 
    "Dortmund", "Essen", "Leipzig", "Bremen", "Dresden", "Hannover", "Nürnberg", 
    "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"
  ];

  const companies = [
    {
      name: "Siemens AG",
      industry: "TECHNOLOGY",
      size: "ENTERPRISE",
      revenue: 62000000000,
      employees: 303000,
      website: "https://www.siemens.com",
      address: "Werner-von-Siemens-Straße 1",
      city: "München",
      country: "Deutschland",
      phone: "+49 89 636-00",
      email: "info@siemens.com",
      description: "Multinational technology company focused on industry, infrastructure, transport, and healthcare.",
      status: "ACTIVE",
      foundedYear: 1847,
      assignedTo: agent1.id,
      createdBy: salesLead.id,
    },
    {
      name: "SAP SE",
      industry: "TECHNOLOGY",
      size: "ENTERPRISE",
      revenue: 30872000000,
      employees: 107400,
      website: "https://www.sap.com",
      address: "Dietmar-Hopp-Allee 16",
      city: "Walldorf",
      country: "Deutschland",
      phone: "+49 6227 7-47474",
      email: "info@sap.com",
      description: "Enterprise application software company providing business software to manage business operations and customer relations.",
      status: "ACTIVE",
      foundedYear: 1972,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "BMW Group",
      industry: "AUTOMOTIVE",
      size: "ENTERPRISE",
      revenue: 142610000000,
      employees: 133778,
      website: "https://www.bmwgroup.com",
      address: "Petuelring 130",
      city: "München",
      country: "Deutschland",
      phone: "+49 89 382-0",
      email: "info@bmwgroup.com",
      description: "Multinational corporation which produces luxury vehicles and motorcycles.",
      status: "ACTIVE",
      foundedYear: 1916,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "Deutsche Bank AG",
      industry: "FINANCE",
      size: "ENTERPRISE",
      revenue: 25300000000,
      employees: 85000,
      website: "https://www.db.com",
      address: "Taunusanlage 12",
      city: "Frankfurt",
      country: "Deutschland",
      phone: "+49 69 910-00",
      email: "info@db.com",
      description: "German multinational investment bank and financial services company.",
      status: "PROSPECT",
      foundedYear: 1870,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "Adidas AG",
      industry: "RETAIL",
      size: "LARGE",
      revenue: 21234000000,
      employees: 60017,
      website: "https://www.adidas.com",
      address: "Adi-Dassler-Straße 1",
      city: "Herzogenaurach",
      country: "Deutschland",
      phone: "+49 9132 84-0",
      email: "info@adidas.com",
      description: "German multinational corporation, founded and headquartered in Herzogenaurach, Germany, that designs and manufactures shoes, clothing and accessories.",
      status: "ACTIVE",
      foundedYear: 1949,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "Bayer AG",
      industry: "PHARMACEUTICALS",
      size: "ENTERPRISE",
      revenue: 47360000000,
      employees: 99637,
      website: "https://www.bayer.com",
      address: "Kaiser-Wilhelm-Allee 1",
      city: "Leverkusen",
      country: "Deutschland",
      phone: "+49 214 30-1",
      email: "info@bayer.com",
      description: "German multinational pharmaceutical and biotechnology company.",
      status: "ACTIVE",
      foundedYear: 1863,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "Continental AG",
      industry: "AUTOMOTIVE",
      size: "LARGE",
      revenue: 33765000000,
      employees: 244226,
      website: "https://www.continental.com",
      address: "Vahrenwalder Straße 9",
      city: "Hannover",
      country: "Deutschland",
      phone: "+49 511 938-0",
      email: "info@continental.com",
      description: "German multinational automotive parts manufacturing company.",
      status: "PROSPECT",
      foundedYear: 1871,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "Merck KGaA",
      industry: "PHARMACEUTICALS",
      size: "LARGE",
      revenue: 19723000000,
      employees: 57000,
      website: "https://www.merckgroup.com",
      address: "Frankfurter Straße 250",
      city: "Darmstadt",
      country: "Deutschland",
      phone: "+49 6151 72-0",
      email: "info@merckgroup.com",
      description: "German multinational science and technology company.",
      status: "ACTIVE",
      foundedYear: 1668,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "Henkel AG & Co. KGaA",
      industry: "MANUFACTURING",
      size: "LARGE",
      revenue: 22241000000,
      employees: 52000,
      website: "https://www.henkel.com",
      address: "Henkelstraße 67",
      city: "Düsseldorf",
      country: "Deutschland",
      phone: "+49 211 797-0",
      email: "info@henkel.com",
      description: "German multinational chemical and consumer goods company.",
      status: "ACTIVE",
      foundedYear: 1876,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "BASF SE",
      industry: "MANUFACTURING",
      size: "ENTERPRISE",
      revenue: 78598000000,
      employees: 110000,
      website: "https://www.basf.com",
      address: "Carl-Bosch-Straße 38",
      city: "Ludwigshafen",
      country: "Deutschland",
      phone: "+49 621 60-0",
      email: "info@basf.com",
      description: "German multinational chemical company and the largest chemical producer in the world.",
      status: "ACTIVE",
      foundedYear: 1865,
      assignedTo: agent1.id,
      createdBy: salesLead.id,
    },
    {
      name: "TechStart Innovations",
      industry: "TECHNOLOGY",
      size: "STARTUP",
      revenue: 2500000,
      employees: 25,
      website: "https://www.techstart-innovations.com",
      address: "Startup-Allee 15",
      city: "Berlin",
      country: "Deutschland",
      phone: "+49 30 12345678",
      email: "hello@techstart-innovations.com",
      description: "Innovative startup developing AI-powered business solutions for SMEs.",
      status: "PROSPECT",
      foundedYear: 2020,
      assignedTo: agent2.id,
      createdBy: agent1.id,
    },
    {
      name: "GreenEnergy Solutions",
      industry: "ENERGY",
      size: "MEDIUM",
      revenue: 45000000,
      employees: 180,
      website: "https://www.greenenergy-solutions.de",
      address: "Umweltstraße 42",
      city: "Hamburg",
      country: "Deutschland",
      phone: "+49 40 98765432",
      email: "info@greenenergy-solutions.de",
      description: "Renewable energy company specializing in solar and wind power solutions.",
      status: "ACTIVE",
      foundedYear: 2015,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "MedTech Innovations",
      industry: "HEALTHCARE",
      size: "SMALL",
      revenue: 12000000,
      employees: 65,
      website: "https://www.medtech-innovations.de",
      address: "Gesundheitsweg 8",
      city: "München",
      country: "Deutschland",
      phone: "+49 89 87654321",
      email: "contact@medtech-innovations.de",
      description: "Medical technology company developing innovative diagnostic devices.",
      status: "PROSPECT",
      foundedYear: 2018,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "FinTech Dynamics",
      industry: "FINANCE",
      size: "STARTUP",
      revenue: 5000000,
      employees: 35,
      website: "https://www.fintech-dynamics.com",
      address: "Digitalstraße 123",
      city: "Frankfurt",
      country: "Deutschland",
      phone: "+49 69 11223344",
      email: "info@fintech-dynamics.com",
      description: "Fintech startup providing blockchain-based payment solutions.",
      status: "ACTIVE",
      foundedYear: 2021,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "AutoParts Manufacturing",
      industry: "MANUFACTURING",
      size: "MEDIUM",
      revenue: 85000000,
      employees: 320,
      website: "https://www.autoparts-mfg.de",
      address: "Industriestraße 67",
      city: "Stuttgart",
      country: "Deutschland",
      phone: "+49 711 55667788",
      email: "info@autoparts-mfg.de",
      description: "Specialized manufacturer of high-quality automotive components.",
      status: "ACTIVE",
      foundedYear: 1995,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "EduTech Solutions",
      industry: "EDUCATION",
      size: "SMALL",
      revenue: 18000000,
      employees: 85,
      website: "https://www.edutech-solutions.de",
      address: "Bildungsweg 25",
      city: "Köln",
      country: "Deutschland",
      phone: "+49 221 99887766",
      email: "hello@edutech-solutions.de",
      description: "Educational technology company developing e-learning platforms.",
      status: "PROSPECT",
      foundedYear: 2017,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "RetailTech Pro",
      industry: "RETAIL",
      size: "MEDIUM",
      revenue: 32000000,
      employees: 150,
      website: "https://www.retailtech-pro.de",
      address: "Handelsstraße 89",
      city: "Düsseldorf",
      country: "Deutschland",
      phone: "+49 211 44556677",
      email: "info@retailtech-pro.de",
      description: "Retail technology solutions provider specializing in POS systems.",
      status: "ACTIVE",
      foundedYear: 2012,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "CloudScale GmbH",
      industry: "TECHNOLOGY",
      size: "STARTUP",
      revenue: 8000000,
      employees: 45,
      website: "https://www.cloudscale.de",
      address: "Cloud-Allee 12",
      city: "Hamburg",
      country: "Deutschland",
      phone: "+49 40 22334455",
      email: "contact@cloudscale.de",
      description: "Cloud infrastructure and scaling solutions for growing businesses.",
      status: "PROSPECT",
      foundedYear: 2019,
      assignedTo: agent3.id,
      createdBy: agent1.id,
    },
    {
      name: "BioPharma Research",
      industry: "PHARMACEUTICALS",
      size: "MEDIUM",
      revenue: 65000000,
      employees: 280,
      website: "https://www.biopharma-research.de",
      address: "Forschungsstraße 156",
      city: "München",
      country: "Deutschland",
      phone: "+49 89 33445566",
      email: "research@biopharma-research.de",
      description: "Biopharmaceutical research company focusing on cancer treatments.",
      status: "ACTIVE",
      foundedYear: 2010,
      assignedTo: agent1.id,
      createdBy: salesLead.id,
    },
    {
      name: "SmartCity Technologies",
      industry: "TECHNOLOGY",
      size: "SMALL",
      revenue: 15000000,
      employees: 75,
      website: "https://www.smartcity-tech.de",
      address: "Zukunftstraße 78",
      city: "Berlin",
      country: "Deutschland",
      phone: "+49 30 66778899",
      email: "info@smartcity-tech.de",
      description: "Smart city technology solutions for urban infrastructure.",
      status: "PROSPECT",
      foundedYear: 2016,
      assignedTo: agent2.id,
      createdBy: agent3.id,
    },
    {
      name: "AeroSpace Dynamics",
      industry: "AEROSPACE",
      size: "LARGE",
      revenue: 120000000,
      employees: 450,
      website: "https://www.aerospace-dynamics.de",
      address: "Flugplatzstraße 234",
      city: "Bremen",
      country: "Deutschland",
      phone: "+49 421 77889900",
      email: "info@aerospace-dynamics.de",
      description: "Aerospace components manufacturer for commercial and military aircraft.",
      status: "ACTIVE",
      foundedYear: 1985,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "FoodTech Innovations",
      industry: "FOOD_BEVERAGE",
      size: "SMALL",
      revenue: 22000000,
      employees: 95,
      website: "https://www.foodtech-innovations.de",
      address: "Genussweg 45",
      city: "Stuttgart",
      country: "Deutschland",
      phone: "+49 711 88990011",
      email: "innovation@foodtech-innovations.de",
      description: "Food technology company developing sustainable packaging solutions.",
      status: "PROSPECT",
      foundedYear: 2014,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "ConstructionMax",
      industry: "CONSTRUCTION",
      size: "MEDIUM",
      revenue: 95000000,
      employees: 380,
      website: "https://www.constructionmax.de",
      address: "Bauweg 167",
      city: "Köln",
      country: "Deutschland",
      phone: "+49 221 99001122",
      email: "bau@constructionmax.de",
      description: "Construction company specializing in sustainable building solutions.",
      status: "ACTIVE",
      foundedYear: 2005,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "Telecom Solutions",
      industry: "TELECOMMUNICATIONS",
      size: "LARGE",
      revenue: 180000000,
      employees: 650,
      website: "https://www.telecom-solutions.de",
      address: "Kommunikationsstraße 89",
      city: "Frankfurt",
      country: "Deutschland",
      phone: "+49 69 10111213",
      email: "solutions@telecom-solutions.de",
      description: "Telecommunications infrastructure and services provider.",
      status: "ACTIVE",
      foundedYear: 1998,
      assignedTo: agent3.id,
      createdBy: salesLead.id,
    },
    {
      name: "MediaTech Group",
      industry: "MEDIA",
      size: "MEDIUM",
      revenue: 45000000,
      employees: 200,
      website: "https://www.mediatech-group.de",
      address: "Medienstraße 123",
      city: "Hamburg",
      country: "Deutschland",
      phone: "+49 40 12131415",
      email: "media@mediatech-group.de",
      description: "Digital media and content creation technology company.",
      status: "PROSPECT",
      foundedYear: 2011,
      assignedTo: agent1.id,
      createdBy: agent2.id,
    },
    {
      name: "LogiTech Transport",
      industry: "TRANSPORTATION",
      size: "LARGE",
      revenue: 150000000,
      employees: 520,
      website: "https://www.logitech-transport.de",
      address: "Transportstraße 456",
      city: "Düsseldorf",
      country: "Deutschland",
      phone: "+49 211 16171819",
      email: "logistics@logitech-transport.de",
      description: "Logistics and transportation technology solutions provider.",
      status: "ACTIVE",
      foundedYear: 2000,
      assignedTo: agent2.id,
      createdBy: salesLead.id,
    },
    {
      name: "CyberSecurity Pro",
      industry: "TECHNOLOGY",
      size: "SMALL",
      revenue: 28000000,
      employees: 120,
      website: "https://www.cybersecurity-pro.de",
      address: "Sicherheitsweg 78",
      city: "München",
      country: "Deutschland",
      phone: "+49 89 20212223",
      email: "security@cybersecurity-pro.de",
      description: "Cybersecurity solutions provider for enterprise clients.",
      status: "PROSPECT",
      foundedYear: 2013,
      assignedTo: agent3.id,
      createdBy: agent1.id,
    },
    {
      name: "DataAnalytics Inc",
      industry: "TECHNOLOGY",
      size: "STARTUP",
      revenue: 12000000,
      employees: 55,
      website: "https://www.dataanalytics-inc.de",
      address: "Datenstraße 234",
      city: "Berlin",
      country: "Deutschland",
      phone: "+49 30 25262728",
      email: "data@dataanalytics-inc.de",
      description: "Big data analytics and machine learning solutions startup.",
      status: "ACTIVE",
      foundedYear: 2020,
      assignedTo: agent1.id,
      createdBy: salesLead.id,
    }
  ];

  await prisma.company.createMany({
    data: companies,
  });

  console.log(`✅ Created ${companies.length} companies`);

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

