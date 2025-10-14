"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDateTime, getActivityIcon } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { isSalesLead } from "@/lib/authorization";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  type: string;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  _source?: "activity" | "callNote" | "task";
}

interface User {
  id: string;
  name: string;
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "CALL" as const,
    duration: "",
    userId: "",
  });

  useEffect(() => {
    async function fetchActivity() {
      try {
        setLoading(true);
        
        // First, try to fetch as an activity
        let response = await fetch(`/api/activities/${params.id}`);
        let activityData = null;
        
        if (response.ok) {
          activityData = await response.json();
        } else if (response.status === 404) {
          // If not found as activity, try as task
          response = await fetch(`/api/tasks/${params.id}`);
          if (response.ok) {
            const taskData = await response.json();
            // Transform task to activity format
            activityData = {
              id: taskData.id,
              title: taskData.title,
              description: taskData.description,
              type: taskData.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK",
              duration: taskData.actualDuration || taskData.estimatedDuration,
              createdAt: taskData.createdAt,
              updatedAt: taskData.updatedAt,
              user: taskData.assignee,
              _source: "task"
            };
          } else if (response.status === 404) {
            // If not found as task, try as call note
            response = await fetch(`/api/call-notes/${params.id}`);
            if (response.ok) {
              const callNoteData = await response.json();
              // Transform call note to activity format
              activityData = {
                id: callNoteData.id,
                title: `Call with ${callNoteData.clientName}`,
                description: callNoteData.notes,
                type: "CALL",
                duration: callNoteData.duration,
                createdAt: callNoteData.createdAt,
                updatedAt: callNoteData.updatedAt,
                user: callNoteData.user,
                _source: "callNote"
              };
            }
          }
        }
        
        if (!activityData) {
          throw new Error('Activity not found');
        }
        
        setActivity(activityData);
        setFormData({
          title: activityData.title || "",
          description: activityData.description || "",
          type: activityData.type || "CALL",
          duration: activityData.duration?.toString() || "",
          userId: activityData.user.id || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    }

    if (params.id) {
      fetchActivity();
      if (isSalesLead(session)) {
        fetchUsers();
      }
    }
  }, [params.id, session]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let response;
      const updateData = {
        title: formData.title,
        description: formData.description || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        userId: formData.userId,
      };

      // Determine which API endpoint to use based on the source
      if (activity?._source === 'task') {
        response = await fetch(`/api/tasks/${params.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || null,
            estimatedDuration: formData.duration ? parseInt(formData.duration) : null,
            assigneeId: formData.userId || null,
          }),
        });
      } else if (activity?._source === 'callNote') {
        response = await fetch(`/api/call-notes/${params.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: formData.description || null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            userId: formData.userId,
          }),
        });
      } else {
        // Regular activity
        response = await fetch(`/api/activities/${params.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || null,
            type: formData.type,
            duration: formData.duration ? parseInt(formData.duration) : null,
            userId: formData.userId,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update activity');
      }

      const updatedData = await response.json();
      
      // Transform the response back to activity format if needed
      let updatedActivity;
      if (activity?._source === 'task') {
        updatedActivity = {
          ...activity,
          title: updatedData.title,
          description: updatedData.description,
          duration: updatedData.actualDuration || updatedData.estimatedDuration,
          user: updatedData.assignee,
          updatedAt: updatedData.updatedAt,
        };
      } else if (activity?._source === 'callNote') {
        updatedActivity = {
          ...activity,
          description: updatedData.notes,
          duration: updatedData.duration,
          user: updatedData.user,
          updatedAt: updatedData.updatedAt,
        };
      } else {
        updatedActivity = updatedData;
      }
      
      setActivity(updatedActivity);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      let response;
      
      // Determine which API endpoint to use based on the source
      if (activity?._source === 'task') {
        response = await fetch(`/api/tasks/${params.id}`, {
          method: 'DELETE',
        });
      } else if (activity?._source === 'callNote') {
        response = await fetch(`/api/call-notes/${params.id}`, {
          method: 'DELETE',
        });
      } else {
        // Regular activity
        response = await fetch(`/api/activities/${params.id}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      router.push('/activities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete activity');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-gray-200 rounded h-64"></div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-800">{error || 'Activity not found'}</p>
          <Link
            href="/activities"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/activities"
            className="text-sm text-gray-600 hover:text-primary mb-2 inline-block"
          >
            ← Back to Activities
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Activity Details</h1>
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                Delete
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Activity Details */}
      <div className="bg-white rounded shadow-card">
        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="text-6xl">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                {editing && activity._source !== 'callNote' ? (
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Activity title"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{activity.title}</h2>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                {editing && activity._source !== 'task' && activity._source !== 'callNote' ? (
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CALL">Call</option>
                    <option value="MEETING">Meeting</option>
                    <option value="EMAIL">Email</option>
                    <option value="NOTE">Note</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <span className="text-lg text-gray-900">{activity.type}</span>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {activity._source === 'callNote' ? 'Call Notes' : 'Description'}
                </label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                    placeholder="Activity description"
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {activity.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                {editing ? (
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Duration in minutes"
                  />
                ) : (
                  <span className="text-gray-900">
                    {activity.duration ? `${activity.duration} minutes` : 'Not specified'}
                  </span>
                )}
              </div>

              {/* Assigned User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned to
                </label>
                {editing && isSalesLead(session) ? (
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">{activity.user.name}</span>
                    <Link
                      href={`/users/${activity.user.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created
                  </label>
                  <span className="text-gray-900">{formatDateTime(activity.createdAt)}</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <span className="text-gray-900">{formatDateTime(activity.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
