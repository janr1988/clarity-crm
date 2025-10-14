"use client";

import { useState, useEffect } from "react";
import { getCapacityStatusColor } from "@/lib/capacityUtils";
import { ChartBarIcon, ClockIcon, CalendarIcon } from "@heroicons/react/24/outline";

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

interface UserCapacityWidgetProps {
  userId: string;
  weekStart?: string;
}

export default function UserCapacityWidget({ userId, weekStart }: UserCapacityWidgetProps) {
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCapacity();
  }, [userId, weekStart]);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const url = weekStart 
        ? `/api/capacity/user/${userId}?week=${weekStart}`
        : `/api/capacity/user/${userId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch capacity");
      }
      
      const data = await response.json();
      setCapacity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getCapacityBarColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "moderate":
        return "bg-yellow-500";
      case "full":
        return "bg-orange-500";
      case "overloaded":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatWorkingHours = (hours: { start: number; end: number }) => {
    const formatHour = (hour: number) => {
      if (hour === 0) return "12 AM";
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return "12 PM";
      return `${hour - 12} PM`;
    };
    
    return `${formatHour(hours.start)} - ${formatHour(hours.end)}`;
  };

  const formatWorkingDays = (days: string[]) => {
    const dayMap: Record<string, string> = {
      monday: "Mon",
      tuesday: "Tue",
      wednesday: "Wed",
      thursday: "Thu",
      friday: "Fri",
      saturday: "Sat",
      sunday: "Sun",
    };
    
    return days.map(day => dayMap[day.toLowerCase()] || day).join(", ");
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !capacity) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 text-gray-500">
          <ChartBarIcon className="w-5 h-5" />
          <span className="text-sm">Capacity data not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-primary" />
          Weekly Capacity
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCapacityStatusColor(capacity.status)}`}>
          {capacity.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Capacity Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Current Load</span>
          <span className="text-sm font-semibold text-gray-900">
            {capacity.currentWeekItems} / {capacity.maxItemsPerWeek} items
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getCapacityBarColor(capacity.status)}`}
            style={{ width: `${Math.min(100, capacity.capacityPercentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {capacity.availableSlots > 0 
              ? `${capacity.availableSlots} slots available`
              : "No available slots"}
          </span>
          <span className="text-xs font-medium text-gray-900">
            {capacity.capacityPercentage}%
          </span>
        </div>
      </div>

      {/* Working Schedule */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Working Days</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatWorkingDays(capacity.workingDays)}
            </p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Working Hours</p>
            <p className="text-sm text-gray-600 mt-1">
              {formatWorkingHours(capacity.workingHours)}
            </p>
          </div>
        </div>
      </div>

      {/* Capacity Recommendations */}
      {capacity.status === "overloaded" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            ⚠️ This team member is overloaded. Consider redistributing tasks.
          </p>
        </div>
      )}
      
      {capacity.status === "full" && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            ⚠️ This team member is at full capacity. Avoid new assignments this week.
          </p>
        </div>
      )}
      
      {capacity.status === "available" && capacity.availableSlots >= 3 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            ✅ This team member has good availability for new assignments.
          </p>
        </div>
      )}
    </div>
  );
}
