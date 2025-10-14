"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TIME_FILTERS_WITH_UPCOMING, TimeFilter as TimeFilterType } from "@/lib/dateUtils";

interface TimeFilterWithUpcomingProps {
  page: string;
}

export default function TimeFilterWithUpcoming({ page }: TimeFilterWithUpcomingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentFilter = searchParams.get('filter') as TimeFilterType || 'upcoming7d';

  const handleFilterChange = (filter: TimeFilterType) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    if (filter === 'upcoming7d') {
      newSearchParams.delete('filter');
    } else {
      newSearchParams.set('filter', filter);
    }

    router.push(`${pathname}?${newSearchParams.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="time-filter" className="text-sm font-medium text-gray-700">
        Time:
      </label>
      <select
        id="time-filter"
        value={currentFilter}
        onChange={(e) => handleFilterChange(e.target.value as TimeFilterType)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {TIME_FILTERS_WITH_UPCOMING.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
    </div>
  );
}
