import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '@/app/users/new/page';

describe('Users/New form', () => {
  beforeEach(() => {
    (global.fetch as any) = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/api/teams')) return new Response(JSON.stringify([{ id: 't1', name: 'Sales Team' }]));
      if (url.endsWith('/api/users') && (input as any).method === 'POST') {
        return new Response(JSON.stringify({ name: 'John Doe', email: 'john@test.com' }), { status: 201 });
      }
      return new Response('[]');
    }) as any;
  });

  it('requires name, email, password, and role fields and posts successfully', async () => {
    render(<Page />);

    await userEvent.type(screen.getByLabelText(/Full Name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/Email/i), 'john@test.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'password123');
    await userEvent.selectOptions(screen.getByLabelText(/Role/i), 'SALES_AGENT');

    await userEvent.click(screen.getByRole('button', { name: /Create User/i }));
    
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/users', expect.anything()));
  });

  it('validates password minimum length', async () => {
    render(<Page />);

    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('minlength', '6');
  });
});

