import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CapacityInfo {
  userId: string;
  userName: string;
  maxItemsPerWeek: number;
  currentWeekItems: number;
  availableSlots: number;
  capacityPercentage: number;
  status: "available" | "moderate" | "full" | "overloaded";
  workingDays: string[];
  workingHours: {
    start: number;
    end: number;
  };
}

interface CapacityData {
  weekStart: string;
  weekEnd: string;
  teamCapacity: CapacityInfo[];
  totalTeamCapacity: number;
  totalTeamUsage: number;
  teamCapacityPercentage: number;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assignee?: {
    id: string;
    name: string;
  };
  estimatedDuration?: number;
  priority: string;
  kanbanStatus: string;
  type: "task" | "call";
}

interface PlanningData {
  teamMembers: TeamMember[];
  capacity: CapacityData;
  weeklyTasks: TaskItem[];
  weekStart: string;
}

/**
 * Custom hook to fetch all planning page data in a single request
 * Provides better performance by reducing API calls
 */
export function usePlanningData(teamId: string | undefined, weekStart: string) {
  const url = teamId ? `/api/planning/initial-data?teamId=${teamId}&weekStart=${weekStart}` : null;

  const { data, error, isLoading, mutate } = useSWR<PlanningData>(
    url,
    fetcher,
    swrConfig
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

