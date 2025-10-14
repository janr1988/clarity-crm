/* @vitest-environment node */
import 'dotenv/config';
import { describe, it, beforeAll, expect } from 'vitest';
import { resetDb, prisma } from '../utils/prismaTestClient';
import { POST as createDeal } from '@/app/api/deals/route';
import { NextRequest } from 'next/server';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { id: 'test-lead', role: 'SALES_LEAD' } })),
}));

function makeJsonRequest(url: string, body: any) {
  return new NextRequest(new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

describe('POST /api/deals', () => {
  beforeAll(async () => {
    await resetDb();
  });

  it('creates deal with required relations', async () => {
    const { agent, company, customer } = await resetDb();

    const req = makeJsonRequest('http://localhost/api/deals', {
      name: 'Integration Deal',
      value: 10000,
      probability: 50,
      stage: 'PROSPECTING',
      companyId: company.id,
      customerId: customer.id,
      ownerId: agent.id,
    });

    const res = await createDeal(req as any);
    expect(res.status).toBe(201);
    const data: any = await res.json();
    const dbDeal = await prisma.deal.findUnique({ where: { id: data.id } });
    expect(dbDeal?.companyId).toBe(company.id);
    expect(dbDeal?.customerId).toBe(customer.id);
  });
});


