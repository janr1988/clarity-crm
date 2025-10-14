"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterWithUpcoming from "@/components/TimeFilterWithUpcoming";
import TeamCapacityOverview from "@/components/TeamCapacityOverview";

interface User {
  id: string;
  name: string;
  role: string;
  _count: {
    tasksAssigned: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignee: {
    id: string;
    name: string;
  } | null;
}

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

interface CallNote {
  id: string;
  customerName: string;
  notes: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

interface DashboardData {
  users: User[];
  tasks: Task[];
  activities: Activity[];
  callNotes: CallNote[];
  upcomingTasks: Task[];
  stats: {
    totalUsers: number;
    activeTasks: number;
    todayActivities: number;
    totalCalls: number;
    upcomingTasks: number;
  };
}

async function getDashboardData(timeFilter: TimeFilterType, userId?: string, isLead?: boolean): Promise<DashboardData> {
  const { start, end } = getDateRange(timeFilter);
  
  const response = await fetch(`/api/dashboard?start=${start.toISOString()}&end=${end.toISOString()}&userId=${userId}&isLead=${isLead}`);
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

interface DashboardPageContentProps {
  userId?: string;
  isLead?: boolean;
  userName?: string;
  teamId?: string;
}

export default function DashboardPageContent({ userId, isLead, userName, teamId }: DashboardPageContentProps) {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('dashboard');
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData(timeFilter, userId, isLead);
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timeFilter, userId, isLead]);

  const getWeekStart = () => {
    const { start } = getDateRange(timeFilter);
    // If it's an upcoming filter, use current week start
    if (timeFilter.startsWith('upcoming')) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.toISOString().split('T')[0];
    }
    return start.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to Clarity CRM, {userName}
          </p>
        </div>
        <TimeFilterWithUpcoming page="dashboard" />
      </div>

      {/* Team Performance KPIs - Only for Sales Lead */}
      {isLead && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 Team Performance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Active Team Members</div>
              <div className="text-3xl font-bold text-gray-900">{data.stats.totalUsers}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Team Active Tasks</div>
              <div className="text-3xl font-bold text-primary">{data.stats.activeTasks}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Upcoming Tasks (7 days)</div>
              <div className="text-3xl font-bold text-orange-600">{data.stats.upcomingTasks}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Today&apos;s Team Activities</div>
              <div className="text-3xl font-bold text-primary">{data.stats.todayActivities}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">Total Team Calls</div>
              <div className="text-3xl font-bold text-primary">{data.stats.totalCalls}</div>
            </div>
          </div>
        </div>
      )}

      {/* My Stats - Only for Sales Agent */}
      {!isLead && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📈 My Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Active Tasks</div>
              <div className="text-3xl font-bold text-primary">{data.stats.activeTasks}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Today&apos;s Activities</div>
              <div className="text-3xl font-bold text-primary">{data.stats.todayActivities}</div>
            </div>
            <div className="bg-white p-6 rounded shadow-card">
              <div className="text-sm text-gray-600 mb-1">My Total Calls</div>
              <div className="text-3xl font-bold text-primary">{data.stats.totalCalls}</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Tasks - Only for Sales Lead */}
      {isLead && data.upcomingTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📋 Upcoming Tasks (Next 7 Days)
          </h2>
          <div className="bg-white p-6 rounded shadow-card">
            <div className="space-y-3">
              {data.upcomingTasks.slice(0, 8).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:border-primary transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.assignee && (
                      <div className="text-sm text-gray-600 mt-1">
                        Assigned to: {task.assignee.name}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800' : task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {task.priority}
                    </span>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {data.upcomingTasks.length > 8 && (
              <div className="mt-4 text-center">
                <Link
                  href="/tasks?filter=upcoming7d"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View all upcoming tasks ({data.upcomingTasks.length})
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Team Overview - Only for Sales Lead */}
        {isLead && (
          <div className="bg-white p-6 rounded shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <Link
                href="/users"
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {data.users.map((user) => (
                <div key={user.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {user._count.tasksAssigned} active tasks
                    </div>
                  </div>
                  <Link
                    href={`/users/${user.id}`}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Capacity Overview - Only for Sales Lead */}
        {isLead && teamId && (
          <TeamCapacityOverview teamId={teamId} weekStart={getWeekStart()} />
        )}

        {/* My Active Tasks - Only for Sales Agent */}
        {!isLead && (
          <div className="bg-white p-6 rounded shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">My Active Tasks</h2>
              <Link
                href="/tasks"
                className="text-sm text-blue-600 hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {data.tasks.length > 0 ? (
                data.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="border-l-4 border-primary pl-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-medium text-gray-900 hover:text-primary"
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.status === 'TODO' ? 'bg-gray-100 text-gray-800' : 
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            task.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active tasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <Link
              href="/activities"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {data.activities.length > 0 ? (
              data.activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm flex-shrink-0">
                    {activity.type.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {activity.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.user.name} on {formatDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recent activities
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
