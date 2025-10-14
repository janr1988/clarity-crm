"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDateTime, getActivityIcon } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterComponent from "@/components/TimeFilter";
import TeamMemberFilter from "@/components/TeamMemberFilter";
import { useSession } from "next-auth/react";
import { isSalesLead } from "@/lib/authorization";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
  _source?: "activity" | "callNote" | "task";
}

interface User {
  id: string;
  name: string;
}

async function getActivities(timeFilter: TimeFilterType, memberFilter: string, currentUserId: string): Promise<Activity[]> {
  const { start, end } = getDateRange(timeFilter);
  
  // Determine userId parameter based on filter
  let userId = '';
  if (memberFilter === 'me') {
    userId = currentUserId;
  } else if (memberFilter !== 'all') {
    userId = memberFilter;
  }
  
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    ...(userId && { userId })
  });
  
  const response = await fetch(`/api/activities?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export default function ActivitiesPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('activities');
  const memberFilter = searchParams.get('member') || (isSalesLead(session) ? 'all' : 'me');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingActivityId, setUpdatingActivityId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const currentUserId = session?.user?.id || '';
        const [activitiesData, usersData] = await Promise.all([
          getActivities(timeFilter, memberFilter, currentUserId),
          isSalesLead(session) ? getUsers() : Promise.resolve([])
        ]);
        setActivities(activitiesData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchData();
    }
  }, [timeFilter, memberFilter, session?.user?.id, session]);

  // Handle user change for Sales Leads
  const handleUserChange = async (activityId: string, newUserId: string) => {
    try {
      setUpdatingActivityId(activityId);
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: newUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update activity');
      }

      // Update the activities list optimistically
      setActivities(prev => prev.map(activity => 
        activity.id === activityId 
          ? { 
              ...activity, 
              user: { 
                id: newUserId, 
                name: users.find(u => u.id === newUserId)?.name || 'Unknown' 
              } 
            }
          : activity
      ));
    } catch (error) {
      console.error('Error updating activity user:', error);
      // You could add a toast notification here
    } finally {
      setUpdatingActivityId(null);
    }
  };

  const activityStats = {
    calls: activities.filter((a) => a.type === "CALL").length,
    meetings: activities.filter((a) => a.type === "MEETING").length,
    emails: activities.filter((a) => a.type === "EMAIL").length,
    tasks: activities.filter((a) => a.type === "TASK" || a.type === "TASK_COMPLETED").length,
    notes: activities.filter((a) => a.type === "NOTE").length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-1">Track team activities and interactions</p>
        </div>
        <div className="flex items-center gap-4">
          <TimeFilterComponent page="activities" />
          <TeamMemberFilter page="activities" />
          <Link
            href="/activities/new"
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            Log Activity
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">📞 Calls</div>
          <div className="text-3xl font-bold text-gray-900">{activityStats.calls}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">👥 Meetings</div>
          <div className="text-3xl font-bold text-gray-900">{activityStats.meetings}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">📧 Emails</div>
          <div className="text-3xl font-bold text-gray-900">{activityStats.emails}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">✅ Tasks</div>
          <div className="text-3xl font-bold text-gray-900">{activityStats.tasks}</div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded shadow-card">
        <div className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/activities/${activity.id}`}
                        className="font-medium text-gray-900 hover:text-primary transition-colors"
                      >
                        {activity.title}
                      </Link>
                      {isSalesLead(session) ? (
                        <select
                          value={activity.user.id}
                          onChange={(e) => handleUserChange(activity.id, e.target.value)}
                          disabled={updatingActivityId === activity.id}
                          className="text-sm text-gray-600 bg-transparent border-none p-0 mt-1 focus:outline-none focus:ring-0 cursor-pointer hover:text-primary"
                        >
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Link
                          href={`/users/${activity.user.id}`}
                          className="text-sm text-gray-600 hover:text-primary mt-1 inline-block"
                        >
                          {activity.user.name}
                        </Link>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </div>
                  {activity.description && (
                    <p className="text-gray-700 mt-2">{activity.description}</p>
                  )}
                  {activity.duration && (
                    <div className="text-sm text-gray-600 mt-2">
                      Duration: {activity.duration} minutes
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No activities found</p>
          </div>
        )}
      </div>
    </div>
  );
}
