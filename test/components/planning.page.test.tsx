import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlanningPageContent from '@/app/planning/PlanningPageContent';
import { SessionProvider } from 'next-auth/react';

describe('Planning Page', () => {
  beforeEach(() => {
    (global.fetch as any) = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes('/api/users')) {
        return new Response(JSON.stringify([
          { id: 'u1', name: 'Agent 1', email: 'a1@test.com', role: 'SALES_AGENT' },
          { id: 'u2', name: 'Agent 2', email: 'a2@test.com', role: 'SALES_AGENT' }
        ]));
      }
      if (url.includes('/api/capacity/team')) {
        return new Response(JSON.stringify({
          weekStart: '2025-10-13',
          totalPlanned: 10,
          totalCapacity: 16,
          utilization: 62.5,
          teamCapacity: [
            {
              userId: 'u1',
              userName: 'Agent 1',
              currentWeekItems: 5,
              maxItemsPerWeek: 8,
              availableSlots: 3,
              capacityPercentage: 62.5,
              status: 'moderate',
              workingDays: ['monday','tuesday','wednesday','thursday','friday'],
              workingHoursStart: 9,
              workingHoursEnd: 17,
              workingHours: { start: 9, end: 17 },
            },
          ],
        }));
      }
      if (url.includes('/api/capacity/user/')) {
        return new Response(JSON.stringify({
          currentWeekItems: 5,
          maxItemsPerWeek: 8,
          availableSlots: 3,
          capacityPercentage: 62.5,
          status: 'moderate'
        }));
      }
      return new Response('[]');
    }) as any;
  });

  it('renders planning page with tabs', async () => {
    render(
      <SessionProvider session={{ user: { id: 'lead1', role: 'SALES_LEAD', name: 'Lead', email: 'lead@test.com' } } as any}>
        <PlanningPageContent teamId="team1" />
      </SessionProvider>
    );
    expect(screen.getAllByText('Team Planning').length).toBeGreaterThan(0);
    expect(screen.getByText('Capacity Overview')).toBeInTheDocument();
  });

  it('shows week navigation controls', () => {
    render(
      <SessionProvider session={{ user: { id: 'lead1', role: 'SALES_LEAD', name: 'Lead', email: 'lead@test.com' } } as any}>
        <PlanningPageContent teamId="team1" />
      </SessionProvider>
    );
    expect(screen.getByTitle('Previous week')).toBeInTheDocument();
    expect(screen.getByTitle('Next week')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('loads team members and allows selection', async () => {
    render(
      <SessionProvider session={{ user: { id: 'lead1', role: 'SALES_LEAD', name: 'Lead', email: 'lead@test.com' } } as any}>
        <PlanningPageContent teamId="team1" />
      </SessionProvider>
    );
    const teamPlanningTab = screen.getAllByText('Team Planning')[1];
    await userEvent.click(teamPlanningTab);
    await waitFor(() => {
      expect(screen.getByText('Agent 1')).toBeInTheDocument();
    });
  });

  it('switches between tabs', async () => {
    render(
      <SessionProvider session={{ user: { id: 'lead1', role: 'SALES_LEAD', name: 'Lead', email: 'lead@test.com' } } as any}>
        <PlanningPageContent teamId="team1" />
      </SessionProvider>
    );
    const teamPlanningTab = screen.getAllByText('Team Planning')[1];
    await userEvent.click(teamPlanningTab);
    await waitFor(() => {
      expect(screen.getByText('View tasks for:')).toBeInTheDocument();
    });
  });
});


