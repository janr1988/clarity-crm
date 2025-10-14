"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate, getInitials, getStatusColor, getPriorityColor } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import { getWeekStart } from "@/lib/capacityUtils";
import TimeFilterWithUpcoming from "./TimeFilterWithUpcoming";
import UserHeaderWithCapacity from "./UserHeaderWithCapacity";
import UserCapacityWidget from "./UserCapacityWidget";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  team: {
    name: string;
  } | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  duration: number | null;
  createdAt: Date;
}

interface CallNote {
  id: string;
  clientName: string;
  clientCompany: string | null;
  createdAt: Date;
}

interface UserDetailsContentProps {
  user: User;
}

export default function UserDetailsContent({ user }: UserDetailsContentProps) {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('user-details');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [callNotes, setCallNotes] = useState<CallNote[]>([]);
  const [stats, setStats] = useState({
    activeTasks: 0,
    completedTasks: 0,
    totalActivities: 0,
    callNotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [user.id, timeFilter]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange(timeFilter);
      
      // Fetch tasks
      const tasksResponse = await fetch(`/api/tasks?start=${start.toISOString()}&end=${end.toISOString()}&assigneeId=${user.id}`);
      const tasksData = await tasksResponse.json();
      
      // Fetch activities
      const activitiesResponse = await fetch(`/api/activities?start=${start.toISOString()}&end=${end.toISOString()}&userId=${user.id}`);
      const activitiesData = await activitiesResponse.json();
      
      // Fetch call notes
      const callNotesResponse = await fetch(`/api/call-notes?start=${start.toISOString()}&end=${end.toISOString()}&userId=${user.id}`);
      const callNotesData = await callNotesResponse.json();
      
      // Calculate stats
      const activeTasks = tasksData.filter((task: any) => ['TODO', 'IN_PROGRESS'].includes(task.status));
      const completedTasks = tasksData.filter((task: any) => task.status === 'COMPLETED');
      
      setTasks(tasksData);
      setActivities(activitiesData);
      setCallNotes(callNotesData);
      setStats({
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        totalActivities: activitiesData.length,
        callNotes: callNotesData.length,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStartString = () => {
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
          <div className="h-32 bg-gray-200 rounded w-full mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/users"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Team
        </Link>
        
        <UserHeaderWithCapacity user={user} weekStart={getWeekStartString()} />
      </div>

      {/* Time Filter */}
      <div className="mb-6 flex justify-end">
        <TimeFilterWithUpcoming page="user-details" />
      </div>

      {/* Stats and Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded shadow-card">
            <div className="text-sm text-gray-600 mb-1">Active Tasks</div>
            <div className="text-3xl font-bold text-primary">{stats.activeTasks}</div>
          </div>
          <div className="bg-white p-6 rounded shadow-card">
            <div className="text-sm text-gray-600 mb-1">Completed Tasks</div>
            <div className="text-3xl font-bold text-green-600">{stats.completedTasks}</div>
          </div>
          <div className="bg-white p-6 rounded shadow-card">
            <div className="text-sm text-gray-600 mb-1">Total Activities</div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalActivities}</div>
          </div>
          <div className="bg-white p-6 rounded shadow-card">
            <div className="text-sm text-gray-600 mb-1">Call Notes</div>
            <div className="text-3xl font-bold text-gray-900">{stats.callNotes}</div>
          </div>
        </div>

        {/* Capacity Widget */}
        {user.role === "SALES_AGENT" && (
          <div className="lg:col-span-1">
            <UserCapacityWidget userId={user.id} weekStart={getWeekStart().toISOString()} />
          </div>
        )}
      </div>

      {/* Active Tasks */}
      <div className="bg-white p-6 rounded shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Active Tasks</h2>
          <Link
            href={`/tasks?assigneeId=${user.id}&filter=${timeFilter}`}
            className="text-sm text-primary hover:text-primary-dark"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {tasks
            .filter(task => ['TODO', 'IN_PROGRESS'].includes(task.status))
            .slice(0, 5)
            .map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block p-4 border border-gray-200 rounded hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <div className="text-sm text-gray-600 ml-4">
                      Due: {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
        </div>
        {tasks.filter(task => ['TODO', 'IN_PROGRESS'].includes(task.status)).length === 0 && (
          <p className="text-gray-500 text-center py-8">No active tasks in this time period</p>
        )}
      </div>

      {/* Recent Activities and Call Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <Link
              href={`/activities?userId=${user.id}&filter=${timeFilter}`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="p-3 border border-gray-200 rounded"
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">
                    {activity.type === "CALL" ? "📞" : activity.type === "MEETING" ? "👥" : activity.type === "EMAIL" ? "📧" : "📝"}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  {activity.duration && (
                    <div className="text-sm text-gray-600">{activity.duration} min</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {activities.length === 0 && (
            <p className="text-gray-500 text-center py-8">No activities in this time period</p>
          )}
        </div>

        {/* Recent Call Notes */}
        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Call Notes</h2>
            <Link
              href={`/call-notes?userId=${user.id}&filter=${timeFilter}`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {callNotes.slice(0, 5).map((note) => (
              <Link
                key={note.id}
                href={`/call-notes/${note.id}`}
                className="block p-3 border border-gray-200 rounded hover:border-primary transition-colors"
              >
                <h4 className="font-medium text-gray-900">{note.clientName}</h4>
                {note.clientCompany && (
                  <p className="text-sm text-gray-600">{note.clientCompany}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(note.createdAt)}
                </p>
              </Link>
            ))}
          </div>
          {callNotes.length === 0 && (
            <p className="text-gray-500 text-center py-8">No call notes in this time period</p>
          )}
        </div>
      </div>
    </div>
  );
}
