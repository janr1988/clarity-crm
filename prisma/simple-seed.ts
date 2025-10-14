import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple seed...');

  // Clear existing data
  await prisma.dealNote.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.callNote.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.userCapacity.deleteMany({});
  await prisma.target.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️ Cleared existing data');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const salesLead = await prisma.user.create({
    data: {
      email: 'lead@clarity.com',
      name: 'John Davis',
      password: hashedPassword,
      role: 'SALES_LEAD',
      isActive: true,
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: 'agent1@clarity.com',
      name: 'Sarah Wilson',
      password: hashedPassword,
      role: 'SALES_AGENT',
      isActive: true,
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@clarity.com',
      name: 'Mike Chen',
      password: hashedPassword,
      role: 'SALES_AGENT',
      isActive: true,
    },
  });

  console.log('✅ Created users');

  // Create companies first
  const companies = await prisma.company.createMany({
    data: [
      {
        name: 'CloudScale GmbH',
        industry: 'TECHNOLOGY',
        size: 'MEDIUM',
        revenue: 5000000,
        employees: 50,
        website: 'https://cloudscale.com',
        phone: '+49 89 123456',
        address: 'Tech Street 1, Munich',
        description: 'Cloud infrastructure provider',
        assignedTo: agent1.id,
        createdBy: salesLead.id,
      },
      {
        name: 'SAP SE',
        industry: 'TECHNOLOGY',
        size: 'ENTERPRISE',
        revenue: 30000000000,
        employees: 100000,
        website: 'https://sap.com',
        phone: '+49 6227 47474',
        address: 'Dietmar-Hopp-Allee 16, Walldorf',
        description: 'Enterprise software company',
        assignedTo: agent2.id,
        createdBy: salesLead.id,
      },
      {
        name: 'BMW Group',
        industry: 'AUTOMOTIVE',
        size: 'ENTERPRISE',
        revenue: 140000000000,
        employees: 130000,
        website: 'https://bmwgroup.com',
        phone: '+49 89 382-0',
        address: 'Petuelring 130, Munich',
        description: 'Automotive manufacturer',
        assignedTo: agent1.id,
        createdBy: salesLead.id,
      },
    ],
  });

  console.log('✅ Created companies');

  // Get companies for customer assignment
  const allCompanies = await prisma.company.findMany();
  console.log(`Found ${allCompanies.length} companies`);

  // Create customers assigned to companies
  const customers = [];
  for (let i = 0; i < 50; i++) {
    const company = allCompanies[i % allCompanies.length];
    customers.push({
      name: `Customer ${i + 1}`,
      email: `customer${i + 1}@${company.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phone: `+49 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      company: company.name,
      position: ['CEO', 'CTO', 'VP Sales', 'Manager', 'Director'][Math.floor(Math.random() * 5)],
      status: 'CUSTOMER',
      source: 'WEBSITE',
      value: Math.floor(Math.random() * 100000) + 10000,
      notes: `Customer ${i + 1} from ${company.name}`,
      assignedTo: Math.random() > 0.5 ? agent1.id : agent2.id,
      createdBy: salesLead.id,
      companyId: company.id, // This is the key field!
    });
  }

  await prisma.customer.createMany({
    data: customers,
  });

  console.log('✅ Created customers with company relationships');

  // Create some deals
  const allCustomers = await prisma.customer.findMany();
  const deals = [];
  for (let i = 0; i < 20; i++) {
    const company = allCompanies[i % allCompanies.length];
    const customer = allCustomers[i % allCustomers.length];
    
    deals.push({
      name: `Deal ${i + 1}`,
      description: `Deal with ${customer.name} from ${company.name}`,
      value: Math.floor(Math.random() * 500000) + 10000,
      probability: Math.floor(Math.random() * 100),
      stage: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION'][Math.floor(Math.random() * 4)],
      expectedCloseDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000),
      source: 'WEBSITE',
      ownerId: Math.random() > 0.5 ? agent1.id : agent2.id,
      customerId: customer.id,
      companyId: company.id,
      createdBy: salesLead.id,
    });
  }

  await prisma.deal.createMany({
    data: deals,
  });

  console.log('✅ Created deals');

  console.log('🎉 Simple seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
