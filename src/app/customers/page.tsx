"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CustomerCard from "@/components/CustomerCard";

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
  _count: {
    activities: number;
    callNotes: number;
    tasks: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCustomers();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    fetchCustomers();
  };

  const getStatusCounts = () => {
    const counts = customers.reduce((acc, customer) => {
      acc[customer.status] = (acc[customer.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer relationships and track deals
          </p>
        </div>
        <Link
          href="/customers/new"
          className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
        >
          + Add Customer
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { status: "LEAD", label: "Leads", color: "bg-blue-500" },
          { status: "PROSPECT", label: "Prospects", color: "bg-yellow-500" },
          { status: "CUSTOMER", label: "Customers", color: "bg-green-500" },
          { status: "INACTIVE", label: "Inactive", color: "bg-gray-500" },
        ].map(({ status, label, color }) => (
          <div key={status} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusCounts[status] || 0}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${color}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
          >
            Search
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No customers found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter
              ? "Try adjusting your search criteria"
              : "Get started by adding your first customer"}
          </p>
          <Link
            href="/customers/new"
            className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            Add Customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
