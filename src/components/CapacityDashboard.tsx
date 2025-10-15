"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getCapacityStatusColor, getCapacityStatusIcon, formatCapacityPercentage } from "@/lib/capacityUtils";
import { isSalesLead } from "@/lib/authorization";

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

interface WeeklyCapacity {
  weekStart: string;
  weekEnd: string;
  teamCapacity: CapacityInfo[];
  totalTeamCapacity: number;
  totalTeamUsage: number;
  teamCapacityPercentage: number;
}

interface CapacityDashboardProps {
  teamId: string;
  initialWeek?: string;
}

export default function CapacityDashboard({ teamId, initialWeek }: CapacityDashboardProps) {
  const { data: session } = useSession();
  const [capacity, setCapacity] = useState<WeeklyCapacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentWeek, setCurrentWeek] = useState(initialWeek || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCapacityData();
  }, [teamId, currentWeek]);

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/capacity/team?teamId=${teamId}&week=${currentWeek}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch capacity data");
      }
      
      const data = await response.json();
      setCapacity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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

  const getCapacityBarColor = (status: CapacityInfo["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "moderate":
        return "bg-yellow-500";
      case "full":
        return "bg-red-500";
      case "overloaded":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!capacity) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 text-gray-700 rounded">
        No capacity data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isSalesLead(session) ? "Team Capacity" : "My Capacity"}
          </h2>
          <p className="text-gray-600">
            Week of {formatDate(capacity.weekStart)} - {formatDate(new Date(new Date(capacity.weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString())}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={currentWeek}
            onChange={(e) => setCurrentWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={fetchCapacityData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Team/Personal Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isSalesLead(session) ? "Total Capacity" : "My Capacity"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{capacity.totalTeamCapacity}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isSalesLead(session) ? "Current Usage" : "My Usage"}
              </p>
              <p className="text-2xl font-bold text-gray-900">{capacity.totalTeamUsage}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Capacity Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCapacityPercentage(capacity.teamCapacityPercentage)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Team Members or Personal Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {capacity.teamCapacity.map((member) => (
          <div key={member.userId} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isSalesLead(session) ? member.userName : "My Capacity"}
                </h3>
                <p className="text-sm text-gray-600">
                  {member.workingDays.length} working days • {formatWorkingHours(member.workingHours)}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCapacityStatusColor(member.status)}`}>
                <span className="mr-1">{getCapacityStatusIcon(member.status)}</span>
                {member.status.replace("_", " ").toUpperCase()}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Capacity</span>
                <span className="font-medium">
                  {member.currentWeekItems} / {member.maxItemsPerWeek} items
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getCapacityBarColor(member.status)}`}
                  style={{ width: `${Math.min(100, member.capacityPercentage)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {member.availableSlots > 0 ? `${member.availableSlots} slots available` : "No available slots"}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCapacityPercentage(member.capacityPercentage)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {capacity.teamCapacity.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {isSalesLead(session) ? "No team members" : "No capacity data"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isSalesLead(session) 
              ? "No sales agents found in this team." 
              : "Unable to load your capacity information."
            }
          </p>
        </div>
      )}
    </div>
  );
}
