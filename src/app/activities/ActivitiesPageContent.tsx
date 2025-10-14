"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDateTime, getActivityIcon } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterComponent from "@/components/TimeFilter";

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
}

async function getActivities(timeFilter: TimeFilterType): Promise<Activity[]> {
  const { start, end } = getDateRange(timeFilter);
  
  const response = await fetch(`/api/activities?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch activities');
  }
  return response.json();
}

export default function ActivitiesPageContent() {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('activities');
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const activitiesData = await getActivities(timeFilter);
        setActivities(activitiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [timeFilter]);

  const activityStats = {
    calls: activities.filter((a) => a.type === "CALL").length,
    meetings: activities.filter((a) => a.type === "MEETING").length,
    emails: activities.filter((a) => a.type === "EMAIL").length,
    other: activities.filter((a) => a.type === "NOTE" || a.type === "OTHER").length,
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
          <div className="text-sm text-gray-600 mb-1">📝 Notes</div>
          <div className="text-3xl font-bold text-gray-900">{activityStats.other}</div>
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
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <Link
                        href={`/users/${activity.user.id}`}
                        className="text-sm text-gray-600 hover:text-primary mt-1 inline-block"
                      >
                        {activity.user.name}
                      </Link>
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
