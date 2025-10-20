"use client";

import useSWR from "swr";
import { ChartBarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { fetcher, swrConfig } from "@/lib/swr-config";

interface TeamCapacityData {
  totalTeamCapacity: number;
  totalTeamUsage: number;
  teamCapacityPercentage: number;
  teamCapacity: Array<{
    userId: string;
    userName: string;
    maxItemsPerWeek: number;
    currentWeekItems: number;
    capacityPercentage: number;
    status: "available" | "moderate" | "full" | "overloaded";
  }>;
}

interface TeamCapacityOverviewProps {
  teamId?: string;
  weekStart?: string;
}

export default function TeamCapacityOverview({ teamId, weekStart }: TeamCapacityOverviewProps) {
  const url = teamId 
    ? weekStart 
      ? `/api/capacity/team?teamId=${teamId}&week=${weekStart}`
      : `/api/capacity/team?teamId=${teamId}`
    : null;

  const { data: capacity, error, isLoading: loading } = useSWR<TeamCapacityData>(
    url,
    fetcher,
    swrConfig
  );

  const getCapacityBarColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-600";
      case "moderate":
        return "text-yellow-600";
      case "full":
        return "text-orange-600";
      case "overloaded":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded shadow-card">
        <div className="flex items-center gap-2 text-red-500">
          <ChartBarIcon className="w-5 h-5" />
          <span className="text-sm">Failed to load team capacity</span>
        </div>
      </div>
    );
  }

  if (!capacity) {
    return (
      <div className="bg-white p-6 rounded shadow-card">
        <div className="flex items-center gap-2 text-gray-500">
          <ChartBarIcon className="w-5 h-5" />
          <span className="text-sm">Team capacity data not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-primary" />
          Team Capacity Overview
        </h3>
        <span className="text-sm text-gray-600">
          {capacity.teamCapacity.length} members
        </span>
      </div>

      {/* Overall Team Capacity */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Team Capacity</span>
          <span className="text-sm font-semibold text-gray-900">
            {capacity.totalTeamUsage} / {capacity.totalTeamCapacity} items
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getCapacityBarColor(capacity.teamCapacityPercentage)}`}
            style={{ width: `${Math.min(100, capacity.teamCapacityPercentage)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {capacity.teamCapacityPercentage}% utilized
          </span>
          <span className="text-xs font-medium text-gray-900">
            {capacity.totalTeamCapacity - capacity.totalTeamUsage} slots available
          </span>
        </div>
      </div>

      {/* Individual Team Members */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
        {capacity.teamCapacity.slice(0, 4).map((member) => (
          <div key={member.userId} className="flex items-center justify-between p-2 border border-gray-200 rounded">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{member.userName}</div>
              <div className="text-xs text-gray-500">
                {member.currentWeekItems} / {member.maxItemsPerWeek} items
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getCapacityBarColor(member.capacityPercentage)}`}
                  style={{ width: `${Math.min(100, member.capacityPercentage)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getStatusColor(member.status)}`}>
                {member.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
        {capacity.teamCapacity.length > 4 && (
          <div className="text-center">
            <span className="text-xs text-gray-500">
              +{capacity.teamCapacity.length - 4} more members
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
