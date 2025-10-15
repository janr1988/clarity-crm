"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { TIME_FILTERS, getDefaultTimeFilter } from "@/lib/dateUtils";
import type { TimeFilter } from "@/lib/dateUtils";

interface TimeFilterProps {
  page?: string;
  className?: string;
  showLabel?: boolean;
}

export default function TimeFilter({ 
  page = '', 
  className = '',
  showLabel = true 
}: TimeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentFilter = (searchParams.get('filter') as TimeFilter) || getDefaultTimeFilter(page);

  const handleFilterChange = (newFilter: TimeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilter === getDefaultTimeFilter(page)) {
      params.delete('filter');
    } else {
      params.set('filter', newFilter);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <>
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </>
      )}
      <select
        value={currentFilter}
        onChange={(e) => handleFilterChange(e.target.value as TimeFilter)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        {TIME_FILTERS.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
    </div>
  );
}
