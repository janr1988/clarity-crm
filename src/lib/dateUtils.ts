/**
 * Date utility functions for time filtering
 */

export type TimeFilter = 
  | 'today'
  | '7d'
  | '30d'
  | '90d'
  | 'month'
  | 'quarter'
  | 'year'
  | 'upcoming7d'
  | 'upcoming30d'
  | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

export const TIME_FILTERS = [
  { label: "Today", value: "today" as TimeFilter },
  { label: "Last 7 days", value: "7d" as TimeFilter },
  { label: "Last 30 days", value: "30d" as TimeFilter },
  { label: "Last 90 days", value: "90d" as TimeFilter },
  { label: "This month", value: "month" as TimeFilter },
  { label: "This quarter", value: "quarter" as TimeFilter },
  { label: "This year", value: "year" as TimeFilter },
  { label: "All time", value: "all" as TimeFilter },
] as const;

export const TIME_FILTERS_WITH_UPCOMING = [
  { label: "Today", value: "today" as TimeFilter },
  { label: "Last 7 days", value: "7d" as TimeFilter },
  { label: "Last 30 days", value: "30d" as TimeFilter },
  { label: "Last 90 days", value: "90d" as TimeFilter },
  { label: "Next 7 days", value: "upcoming7d" as TimeFilter },
  { label: "Next 30 days", value: "upcoming30d" as TimeFilter },
  { label: "This month", value: "month" as TimeFilter },
  { label: "This quarter", value: "quarter" as TimeFilter },
  { label: "This year", value: "year" as TimeFilter },
  { label: "All time", value: "all" as TimeFilter },
] as const;

/**
 * Get date range based on time filter
 */
export function getDateRange(filter: TimeFilter): DateRange {
  const now = new Date();
  
  switch (filter) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      };
    
    case '7d':
      return {
        start: subDays(now, 7),
        end: now
      };
    
    case '30d':
      return {
        start: subDays(now, 30),
        end: now
      };
    
    case '90d':
      return {
        start: subDays(now, 90),
        end: now
      };
    
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now)
      };
    
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now)
      };
    
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now)
      };
    
    case 'upcoming7d':
      return {
        start: now,
        end: addDays(now, 7)
      };
    
    case 'upcoming30d':
      return {
        start: now,
        end: addDays(now, 30)
      };
    
    case 'all':
    default:
      return {
        start: new Date(0), // Very old date
        end: now
      };
  }
}

/**
 * Helper functions for date manipulation
 */
function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
}

function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
}

function startOfQuarter(date: Date): Date {
  const result = new Date(date);
  const quarter = Math.floor(result.getMonth() / 3);
  result.setMonth(quarter * 3, 1);
  return startOfDay(result);
}

function endOfQuarter(date: Date): Date {
  const result = new Date(date);
  const quarter = Math.floor(result.getMonth() / 3);
  result.setMonth(quarter * 3 + 3, 0);
  return endOfDay(result);
}

function startOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  return startOfDay(result);
}

function endOfYear(date: Date): Date {
  const result = new Date(date);
  result.setMonth(11, 31);
  return endOfDay(result);
}

/**
 * Format date range for display
 */
export function formatDateRange(filter: TimeFilter): string {
  const { start, end } = getDateRange(filter);
  
  if (filter === 'all') {
    return 'All time';
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Get default time filter for different pages
 */
export function getDefaultTimeFilter(page: string): TimeFilter {
  switch (page) {
    case 'dashboard':
      return 'upcoming7d';
    case 'tasks':
      return 'upcoming7d';
    case 'activities':
      return '7d';
    case 'call-notes':
      return '30d';
    case 'kpis':
      return '30d';
    case 'deals':
      return '90d';
    case 'user-details':
      return 'upcoming7d';
    default:
      return '30d';
  }
}
