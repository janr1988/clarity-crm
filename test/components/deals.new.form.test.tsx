import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/deals/new/page';

describe('Deals/New form', () => {
  beforeEach(() => {
    (global.fetch as any) = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/api/companies')) return new Response(JSON.stringify([{ id: 'c1', name: 'Acme' }]));
      if (url.includes('/api/users')) return new Response(JSON.stringify([{ id: 'u1', name: 'Agent', email: 'a@x' }]));
      if (url.includes('/api/customers?companyId=c1')) return new Response(JSON.stringify([{ id: 'cust1', name: 'Alice', companyId: 'c1' }]));
      if (url.endsWith('/api/deals') && (input as any).method === 'POST') return new Response(JSON.stringify({ name: 'Deal A' }), { status: 201 });
      return new Response('[]');
    }) as any;
  });

  it('requires company and customer and posts successfully', async () => {
    render(<Page />);

    await userEvent.type(screen.getByLabelText(/Opportunity Name/i), 'Deal A');
    await userEvent.type(screen.getByLabelText(/Opportunity Value/i), '12345');

    await userEvent.selectOptions(screen.getByLabelText(/Company \*/i), 'c1');
    await waitFor(() => screen.getByLabelText(/Customer \*/i));
    await userEvent.selectOptions(screen.getByLabelText(/Customer \*/i), 'cust1');

    await userEvent.click(screen.getByRole('button', { name: /Create Opportunity/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/deals', expect.anything()));
  });
});


