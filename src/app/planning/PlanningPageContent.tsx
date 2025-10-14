"use client";

import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import CapacityDashboard from "@/components/CapacityDashboard";
import WeeklyKanbanBoard from "@/components/WeeklyKanbanBoard";
import { getWeekStart } from "@/lib/capacityUtils";
import { CalendarIcon, ChartBarIcon, UsersIcon } from "@heroicons/react/24/outline";

interface PlanningPageContentProps {
  teamId: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function PlanningPageContent({ teamId }: PlanningPageContentProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    // Use the centralized getWeekStart function for consistency
    const weekStart = getWeekStart();
    const weekString = weekStart.toISOString().split('T')[0];
    
    console.log('=== PLANNING PAGE FRONTEND DEBUG - UPDATED AT:', new Date().toISOString(), '===');
    console.log('Planning Page - Using getWeekStart():', weekStart.toISOString());
    console.log('Planning Page - Week string:', weekString);
    console.log('Planning Page - WeekStart day of week:', weekStart.getDay());
    console.log('=== END PLANNING PAGE DEBUG ===');
    
    return weekString;
  });
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, [teamId]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users?teamId=${teamId}&role=SALES_AGENT`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch team members");
      }
      
      const data = await response.json();
      setTeamMembers(data);
      
      // Select first member by default
      if (data.length > 0 && !selectedMember) {
        setSelectedMember(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching team members:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatWeekRange = (weekStart: string) => {
    try {
      const start = new Date(weekStart + 'T00:00:00'); // Ensure proper timezone handling
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } catch (error) {
      console.error('Error formatting week range:', error);
      return 'Invalid Date';
    }
  };

  const goToNextWeek = () => {
    const current = new Date(selectedWeek + 'T00:00:00');
    current.setDate(current.getDate() + 7);
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  const goToPrevWeek = () => {
    const current = new Date(selectedWeek + 'T00:00:00');
    current.setDate(current.getDate() - 7);
    setSelectedWeek(current.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(getWeekStart().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Team Planning</h1>
          <p className="text-gray-600 mt-1">Manage team capacity and weekly tasks</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900 whitespace-nowrap">
              {formatWeekRange(selectedWeek)}
            </span>
          </div>
          
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button
            onClick={goToCurrentWeek}
            className="ml-2 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors whitespace-nowrap"
          >
            This Week
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${selected
                ? "bg-white text-primary shadow"
                : "text-gray-700 hover:bg-white/[0.12] hover:text-gray-900"
              }`
            }
          >
            <div className="flex items-center justify-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              <span>Capacity Overview</span>
            </div>
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-colors
              ${selected
                ? "bg-white text-primary shadow"
                : "text-gray-700 hover:bg-white/[0.12] hover:text-gray-900"
              }`
            }
          >
            <div className="flex items-center justify-center gap-2">
              <UsersIcon className="w-5 h-5" />
              <span>Team Planning</span>
            </div>
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-6">
          {/* Capacity Overview Tab */}
          <Tab.Panel>
            <CapacityDashboard teamId={teamId} initialWeek={selectedWeek} />
          </Tab.Panel>

          {/* Team Planning Tab */}
          <Tab.Panel>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-96"></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Member Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label htmlFor="member-select" className="text-sm font-medium text-gray-700">
                    View tasks for:
                  </label>
                  <select
                    id="member-select"
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kanban Board */}
                {selectedMember && (
                  <WeeklyKanbanBoard
                    userId={selectedMember}
                    weekStart={selectedWeek}
                  />
                )}

                {teamMembers.length === 0 && (
                  <div className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No sales agents found in this team.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
