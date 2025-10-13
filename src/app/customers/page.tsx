"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CustomerCard from "@/components/CustomerCard";
import { Customer } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function CustomersPage() {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [assignedToFilter, setAssignedToFilter] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (statusFilter) params.append("status", statusFilter);
        if (sourceFilter) params.append("source", sourceFilter);
        if (assignedToFilter) params.append("assignedTo", assignedToFilter);
        
        const response = await fetch(`/api/customers?${params.toString()}`);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view customers");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCustomers(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Only fetch if session is available and not loading
    if (session && session.user) {
      fetchCustomers();
    } else if (session === null) {
      // Session is confirmed to be null (not loading)
      setError("Please log in to view customers");
      setIsLoading(false);
    }
  }, [session, statusFilter, sourceFilter, assignedToFilter]);

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower) ||
      customer.position?.toLowerCase().includes(searchLower) ||
      customer.source?.toLowerCase().includes(searchLower) ||
      customer.notes?.toLowerCase().includes(searchLower)
    );
  });

  const statusCounts = customers.reduce((acc, customer) => {
    const status = customer.status || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceCounts = customers.reduce((acc, customer) => {
    const source = customer.source || "UNKNOWN";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Show loading state while session is being determined or data is loading
  if (isLoading || (session === undefined)) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>
        <div className="text-gray-600">Loading customers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers</h2>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
        <Link
          href="/customers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2">➕</span>
          New Customer
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{statusCounts.CUSTOMER || 0}</div>
          <div className="text-sm text-gray-600">Active Customers</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.PROSPECT || 0}</div>
          <div className="text-sm text-gray-600">Prospects</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{statusCounts.LEAD || 0}</div>
          <div className="text-sm text-gray-600">Leads</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Search Customers
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Search by name, email, company, position, or notes..."
            />
          </div>
          
          <div className="flex gap-2 items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setSourceFilter("");
                setAssignedToFilter("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              📊 Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
              📍 Source
            </label>
            <select
              id="source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERRAL">Referral</option>
              <option value="COLD_CALL">Cold Call</option>
              <option value="SOCIAL_MEDIA">Social Media</option>
              <option value="TRADE_SHOW">Trade Show</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              👤 Assigned To
            </label>
            <select
              id="assignedTo"
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {/* TODO: Add dynamic user list */}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter || sourceFilter || assignedToFilter) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}" ×
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Status: {statusFilter} ×
                </span>
              )}
              {sourceFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Source: {sourceFilter.replace("_", " ")} ×
                </span>
              )}
              {assignedToFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Assigned: {assignedToFilter} ×
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="text-gray-600">
          {customers.length === 0 ? "No customers found." : "No customers match your search criteria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}