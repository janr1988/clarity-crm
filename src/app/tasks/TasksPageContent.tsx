"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate, getStatusColor, getPriorityColor } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterWithUpcoming from "@/components/TimeFilterWithUpcoming";
import TeamMemberFilter from "@/components/TeamMemberFilter";
import { useSession } from "next-auth/react";
import { isSalesLead } from "@/lib/authorization";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
  assignee: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function getTasks(timeFilter: TimeFilterType, assigneeFilter: string, currentUserId: string): Promise<Task[]> {
  const { start, end } = getDateRange(timeFilter);
  
  // Build query parameters
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
  });

  // Add assignee filter
  if (assigneeFilter === 'me') {
    params.set('assigneeId', currentUserId);
  } else if (assigneeFilter !== 'all') {
    params.set('assigneeId', assigneeFilter);
  }
  
  const response = await fetch(`/api/tasks?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

export default function TasksPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('tasks');
  const assigneeFilter = searchParams.get('member') || (isSalesLead(session) ? 'all' : 'me');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Fetch users for assignee dropdown
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const currentUserId = session?.user?.id || '';
        const tasksData = await getTasks(timeFilter, assigneeFilter, currentUserId);
        setTasks(tasksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      fetchTasks();
    }
  }, [timeFilter, assigneeFilter, session?.user?.id]);

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
    CANCELLED: tasks.filter((t) => t.status === "CANCELLED"),
  };

  // Handle assignee change for Sales Leads
  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    try {
      setUpdatingTaskId(taskId);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigneeId: newAssigneeId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task assignee');
      }

      const updatedTask = await response.json();
      
      // Update the task in the local state
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Error updating task assignee:', error);
      alert('Failed to update task assignee');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const isLead = isSalesLead(session);

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
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage team tasks and assignments</p>
        </div>
        <div className="flex items-center gap-4">
          <TimeFilterWithUpcoming page="tasks" />
          <TeamMemberFilter page="tasks" />
          <Link
            href="/tasks/new"
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            New Task
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">To Do</div>
          <div className="text-3xl font-bold text-gray-900">
            {tasksByStatus.TODO.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">In Progress</div>
          <div className="text-3xl font-bold text-blue-600">
            {tasksByStatus.IN_PROGRESS.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {tasksByStatus.COMPLETED.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Cancelled</div>
          <div className="text-3xl font-bold text-red-600">
            {tasksByStatus.CANCELLED.length}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isLead ? (
                      <select
                        value={task.assignee?.id || ''}
                        onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                        disabled={updatingTaskId === task.id}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      task.assignee ? (
                        <Link
                          href={`/users/${task.assignee.id}`}
                          className="text-gray-900 hover:text-primary"
                        >
                          {task.assignee.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {task.dueDate ? formatDate(task.dueDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
}
