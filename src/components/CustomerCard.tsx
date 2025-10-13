"use client";

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
  _count: {
    activities: number;
    callNotes: number;
    tasks: number;
  };
}

interface CustomerCardProps {
  customer: Customer;
}

export default function CustomerCard({ customer }: CustomerCardProps) {
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

  return (
    <Link href={`/customers/${customer.id}`}>
      <div className="bg-white p-6 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {customer.name}
            </h3>
            {customer.company && (
              <p className="text-sm text-gray-600 mb-1">{customer.company}</p>
            )}
            {customer.position && (
              <p className="text-sm text-gray-500">{customer.position}</p>
            )}
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
              customer.status
            )}`}
          >
            {customer.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          {customer.email && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2">📧</span>
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-4 h-4 mr-2">📞</span>
              {customer.phone}
            </div>
          )}
          {customer.value && (
            <div className="flex items-center text-sm font-medium text-green-600">
              <span className="w-4 h-4 mr-2">💰</span>
              {formatValue(customer.value)}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>📋 {customer._count.activities}</span>
            <span>📞 {customer._count.callNotes}</span>
            <span>✓ {customer._count.tasks}</span>
          </div>
          {customer.assignee && (
            <span className="text-xs">
              Assigned to {customer.assignee.name}
            </span>
          )}
        </div>

        {customer.source && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Source: {customer.source.replace("_", " ")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
