import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
    }),
  };
});

vi.mock('next-auth', async (orig) => {
  try {
    const actual: any = await (orig as any)();
    return {
      ...actual,
      getServerSession: vi.fn(async () => ({
        user: { id: 'test-lead', name: 'Lead', email: 'lead@clarity.com', role: 'SALES_LEAD' },
      })),
    };
  } catch {
    return { getServerSession: vi.fn(async () => null) } as any;
  }
});


