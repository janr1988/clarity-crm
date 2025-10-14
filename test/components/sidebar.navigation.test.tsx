import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

const sessionMockLead = {
  data: { user: { id: 'lead1', name: 'Lead', email: 'lead@test.com', role: 'SALES_LEAD' } },
  status: 'authenticated',
};

const sessionMockAgent = {
  data: { user: { id: 'agent1', name: 'Agent', email: 'agent@test.com', role: 'SALES_AGENT' } },
  status: 'authenticated',
};

describe('Sidebar Planning link', () => {
  it('shows Planning link for Sales Lead', async () => {
    vi.doMock('next-auth/react', () => ({
      useSession: () => sessionMockLead,
      signOut: vi.fn(),
    }));
    const { default: SidebarComp } = await import('@/components/Sidebar');
    render(<SidebarComp />);
    const link = screen.getByText('Planning').closest('a');
    expect(link).toHaveAttribute('href', '/planning');
  });

  it('hides Planning link for Sales Agent', async () => {
    vi.resetModules();
    vi.doMock('next-auth/react', () => ({
      useSession: () => sessionMockAgent,
      signOut: vi.fn(),
    }));
    const { default: SidebarComp } = await import('@/components/Sidebar');
    render(<SidebarComp />);
    expect(screen.queryByText('Planning')).not.toBeInTheDocument();
  });
});


