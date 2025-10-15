"use client";

import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { useSession } from "next-auth/react";
import CapacityDashboard from "@/components/CapacityDashboard";
import WeeklyKanbanBoard from "@/components/WeeklyKanbanBoard";
import { getWeekStart } from "@/lib/capacityUtils";
import { isSalesLead } from "@/lib/authorization";
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
  const { data: session } = useSession();
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
      
      if (isSalesLead(session)) {
        // Sales Lead can see all team members
        const response = await fetch(`/api/users?teamId=${teamId}&role=SALES_AGENT`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch team members");
        }
        
        const data = await response.json();

        // Add a convenient "Me (Current User)" option to quickly filter to self
        const meOption: TeamMember | null = session?.user
          ? {
              id: session.user.id,
              name: session.user.name || "Me (Current User)",
              email: (session.user as any).email || "",
              role: session.user.role || "",
            }
          : null;

        // Add an "All Team Members" synthetic option
        const allOption: TeamMember = {
          id: "ALL",
          name: "All Team Members",
          email: "",
          role: "",
        };

        const members: TeamMember[] = meOption
          ? [allOption, meOption, ...data.filter((m: TeamMember) => m.id !== meOption.id)]
          : data;

        setTeamMembers(members);
        
        // Select first member by default
        if (members.length > 0 && !selectedMember) {
          setSelectedMember(members[0].id);
        }
      } else {
        // Sales Agent can only see themselves
        if (session?.user?.id) {
          const response = await fetch(`/api/users/${session.user.id}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          
          const userData = await response.json();
          setTeamMembers([userData]);
          setSelectedMember(session.user.id);
        }
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

      {/* Tabs - Only show for Sales Leads */}
      {isSalesLead(session) ? (
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
                      userId={selectedMember === 'all' ? undefined : selectedMember}
                      teamId={selectedMember === 'all' ? teamId : undefined}
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
      ) : (
        /* Sales Agent view - Direct Kanban Board with assignee filter (self) */
        <div className="mt-6 space-y-6">
          {/* Member Selection (self) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label htmlFor="member-select-self" className="text-sm font-medium text-gray-700">
              View tasks for:
            </label>
            <select
              id="member-select-self"
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
              {/* Kanban Board for Sales Agent */}
              {selectedMember && (
                <WeeklyKanbanBoard
                  userId={selectedMember}
                  teamId={teamId}
                  weekStart={selectedWeek}
                />
              )}

              {teamMembers.length === 0 && (
                <div className="text-center py-12">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No user data</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Unable to load your user information.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
