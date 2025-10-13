"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Company, Customer, Activity, Task } from "@prisma/client";
import { useSession } from "next-auth/react";

interface CompanyWithRelations extends Company {
  creator: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  customers: Customer[];
  activities: Activity[];
  tasks: Task[];
  _count: {
    customers: number;
    activities: number;
    tasks: number;
  };
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [company, setCompany] = useState<CompanyWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/companies/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCompany(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (session) {
      fetchCompany();
    }
  }, [id, session]);

  const formatRevenue = (revenue: number | null | undefined) => {
    if (!revenue) return "N/A";
    if (revenue >= 1000000000) {
      return `€${(revenue / 1000000000).toFixed(1)}B`;
    } else if (revenue >= 1000000) {
      return `€${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `€${(revenue / 1000).toFixed(1)}K`;
    }
    return `€${revenue.toLocaleString()}`;
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PROSPECT":
        return "bg-blue-100 text-blue-800";
      case "PARTNER":
        return "bg-purple-100 text-purple-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSizeColor = (size: string | null | undefined) => {
    switch (size) {
      case "STARTUP":
        return "bg-yellow-100 text-yellow-800";
      case "SMALL":
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-indigo-100 text-indigo-800";
      case "LARGE":
        return "bg-purple-100 text-purple-800";
      case "ENTERPRISE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
        <div className="text-gray-600">Loading company details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h2>
        <div className="text-gray-600">Company not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {company.name}
          </h2>
          <div className="flex gap-2">
            {company.status && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  company.status
                )}`}
              >
                {company.status}
              </span>
            )}
            {company.size && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSizeColor(
                  company.size
                )}`}
              >
                {company.size}
              </span>
            )}
          </div>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary-light hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            🌐 Visit Website
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Overview */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.industry || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Founded</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.foundedYear || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Revenue</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatRevenue(company.revenue)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Employees</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.employees ? company.employees.toLocaleString() : "N/A"}
                </dd>
              </div>
            </div>
            {company.description && (
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.description}</dd>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.email ? (
                    <a href={`mailto:${company.email}`} className="text-primary hover:text-primary-dark">
                      {company.email}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {company.phone ? (
                    <a href={`tel:${company.phone}`} className="text-primary hover:text-primary-dark">
                      {company.phone}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {[company.address, company.city, company.country].filter(Boolean).join(", ") || "N/A"}
                </dd>
              </div>
            </div>
          </div>

          {/* Recent Customers */}
          {company.customers.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customers</h3>
              <div className="space-y-3">
                {company.customers.slice(0, 5).map((customer) => (
                  <div key={customer.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.position || "N/A"}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === "CUSTOMER" ? "bg-green-100 text-green-800" :
                      customer.status === "PROSPECT" ? "bg-blue-100 text-blue-800" :
                      customer.status === "LEAD" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                ))}
              </div>
              {company._count.customers > 5 && (
                <div className="mt-3 text-sm text-gray-500">
                  And {company._count.customers - 5} more customers...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customers</span>
                <span className="text-sm font-medium text-gray-900">{company._count.customers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Activities</span>
                <span className="text-sm font-medium text-gray-900">{company._count.activities}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tasks</span>
                <span className="text-sm font-medium text-gray-900">{company._count.tasks}</span>
              </div>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created by</dt>
                <dd className="mt-1 text-sm text-gray-900">{company.creator.name}</dd>
              </div>
              {company.assignee && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                  <dd className="mt-1 text-sm text-gray-900">{company.assignee.name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(company.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {company.activities.length > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {company.activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-gray-500">
                      {activity.type} • {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
