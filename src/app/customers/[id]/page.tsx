"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status: string;
  source?: string;
  value?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
  companyRef?: {
    id: string;
    name: string;
    industry?: string;
    size?: string;
    website?: string;
    city?: string;
  };
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    createdAt: string;
    user: { name: string };
  }>;
  callNotes: Array<{
    id: string;
    clientName: string;
    notes: string;
    outcome?: string;
    createdAt: string;
    user: { name: string };
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    assignee?: { name: string };
  }>;
  _count: {
    activities: number;
    callNotes: number;
    tasks: number;
  };
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      fetchCustomer(params.id as string);
    }
  }, [params.id]);

  const fetchCustomer = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Customer not found");
        }
        throw new Error("Failed to fetch customer");
      }
      
      const data = await response.json();
      setCustomer(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LEAD":
        return "bg-blue-100 text-blue-800";
      case "PROSPECT":
        return "bg-yellow-100 text-yellow-800";
      case "CUSTOMER":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatValue = (value?: number) => {
    if (!value) return null;
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error}
          </h1>
          <button
            onClick={() => router.push("/customers")}
            className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {customer.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                    customer.status
                  )}`}
                >
                  {customer.status}
                </span>
                {(customer.companyRef?.name || customer.company) && (
                  <span className="text-gray-600">
                    {customer.companyRef?.name || customer.company}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
            <button className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors">
              + Add Activity
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <p className="text-gray-900">{customer.phone}</p>
                  </div>
                )}
                {(customer.companyRef?.name || customer.company) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company
                    </label>
                    <p className="text-gray-900">
                      {customer.companyRef?.name || customer.company}
                    </p>
                    {customer.companyRef && (
                      <div className="mt-2 flex gap-2">
                        {customer.companyRef.industry && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {customer.companyRef.industry}
                          </span>
                        )}
                        {customer.companyRef.size && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {customer.companyRef.size}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {customer.position && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <p className="text-gray-900">{customer.position}</p>
                  </div>
                )}
                {customer.source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <p className="text-gray-900">{customer.source.replace("_", " ")}</p>
                  </div>
                )}
                {customer.value && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opportunity Value
                    </label>
                    <p className="text-green-600 font-semibold">
                      {formatValue(customer.value)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Notes
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}

            {/* Recent Activities */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <Link
                  href={`/activities?customer=${customer.id}`}
                  className="text-primary hover:underline"
                >
                  View all ({customer._count.activities})
                </Link>
              </div>
              {customer.activities.length > 0 ? (
                <div className="space-y-3">
                  {customer.activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{activity.user.name}</span>
                          <span>•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No activities yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Activities</span>
                  <span className="font-semibold">{customer._count.activities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Call Notes</span>
                  <span className="font-semibold">{customer._count.callNotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks</span>
                  <span className="font-semibold">{customer._count.tasks}</span>
                </div>
              </div>
            </div>

            {/* Recent Call Notes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Calls
                </h3>
                <Link
                  href={`/call-notes?customer=${customer.id}`}
                  className="text-primary hover:underline text-sm"
                >
                  View all
                </Link>
              </div>
              {customer.callNotes.length > 0 ? (
                <div className="space-y-3">
                  {customer.callNotes.slice(0, 3).map((call) => (
                    <div key={call.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium text-gray-900 text-sm">{call.clientName}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{call.notes}</p>
                      {call.outcome && (
                        <p className="text-xs text-green-600 mt-1">{call.outcome}</p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                        <span>{call.user.name}</span>
                        <span>•</span>
                        <span>{formatDate(call.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No call notes yet</p>
              )}
            </div>

            {/* Recent Tasks */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Tasks
                </h3>
                <Link
                  href={`/tasks?customer=${customer.id}`}
                  className="text-primary hover:underline text-sm"
                >
                  View all
                </Link>
              </div>
              {customer.tasks.length > 0 ? (
                <div className="space-y-3">
                  {customer.tasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="p-3 bg-gray-50 rounded">
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        {task.assignee && (
                          <span className="text-xs text-gray-500">{task.assignee.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(task.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
