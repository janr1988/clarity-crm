import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDb() {
  await prisma.dealNote.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.callNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.company.deleteMany();
  await prisma.target.deleteMany();
  await prisma.userCapacity.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  const lead = await prisma.user.create({
    data: { email: 'lead@test.com', name: 'Lead', password: 'hash', role: 'SALES_LEAD', isActive: true },
  });
  const agent = await prisma.user.create({
    data: { email: 'agent@test.com', name: 'Agent', password: 'hash', role: 'SALES_AGENT', isActive: true },
  });
  const team = await prisma.team.create({ data: { name: 'Team' } });
  await prisma.userCapacity.create({ data: { userId: lead.id } });

  const company = await prisma.company.create({
    data: {
      name: 'Acme',
      status: 'ACTIVE',
      createdBy: lead.id,
      assignedTo: agent.id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      name: 'Alice Doe',
      status: 'CUSTOMER',
      createdBy: lead.id,
      assignedTo: agent.id,
      company: company.name,
      companyId: company.id,
    },
  });

  return { lead, agent, team, company, customer };
}


