import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCreateForm from '@/components/TaskCreateForm';

describe('Tasks/New form', () => {
  it('normalizes datetime-local to ISO and posts', async () => {
    const users = [{ id: 'u1', name: 'Agent', email: 'a@x' }];

    (global.fetch as any) = vi.fn(async (url: string, init?: any) => {
      if (url === '/api/tasks' && init?.method === 'POST') {
        const body = JSON.parse(init.body);
        expect(body.dueDate).toMatch(/T/);
        return new Response(JSON.stringify({ id: 't1' }), { status: 201 });
      }
      return new Response('{}');
    });

    render(<TaskCreateForm users={users as any} />);

    await userEvent.type(screen.getByLabelText(/Title/i), 'Call');
    await userEvent.type(screen.getByLabelText(/Due Date/i), '2025-12-01T12:00');
    await userEvent.click(screen.getByRole('button', { name: /Create Task/i }));
  });
});


