"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Deal {
  id: string;
  name: string;
  value: number;
  probability: number;
  stage: string;
  expectedCloseDate: string | null;
  customer: {
    id: string;
    name: string;
  };
  company: {
    id: string;
    name: string;
    industry: string | null;
  };
  owner: {
    id: string;
    name: string;
  };
  _count: {
    notes: number;
  };
}

export default function DealsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState("");

  useEffect(() => {
    async function fetchDeals() {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (stageFilter) params.append("stage", stageFilter);

        const response = await fetch(`/api/deals?${params.toString()}`);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view deals");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDeals(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (sessionStatus === "authenticated" && session?.user) {
      fetchDeals();
    } else if (sessionStatus === "unauthenticated") {
      setError("Please log in to view deals");
      setIsLoading(false);
    }
  }, [sessionStatus, session, stageFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "PROSPECTING":
        return "bg-blue-100 text-blue-800";
      case "QUALIFICATION":
        return "bg-indigo-100 text-indigo-800";
      case "PROPOSAL":
        return "bg-purple-100 text-purple-800";
      case "NEGOTIATION":
        return "bg-pink-100 text-pink-800";
      case "CLOSED_WON":
        return "bg-green-100 text-green-800";
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stageCounts = deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const weightedValue = deals.reduce(
    (sum, deal) => sum + deal.value * (deal.probability / 100),
    0
  );

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Deals</h2>
        <div className="text-gray-600">Loading deals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Deals</h2>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const dealStages = [
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Deals & Opportunities</h2>
        <Link
          href="/deals/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2">➕</span>
          New Deal
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Total Deals</div>
          <div className="text-2xl font-bold text-gray-900">{deals.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Pipeline Value</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Weighted Value</div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(weightedValue)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">Won Deals</div>
          <div className="text-2xl font-bold text-green-600">
            {stageCounts.CLOSED_WON || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
              📊 Filter by Stage
            </label>
            <select
              id="stage"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Stages</option>
              {dealStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {stageFilter && (
            <div className="flex items-end">
              <button
                onClick={() => setStageFilter("")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Deals Table */}
      {deals.length === 0 ? (
        <div className="text-gray-600">No deals found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => (window.location.href = `/deals/${deal.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{deal.name}</div>
                    <div className="text-sm text-gray-500">{deal.customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{deal.company.name}</div>
                    {deal.company.industry && (
                      <div className="text-xs text-gray-500">{deal.company.industry}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(deal.value)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                        deal.stage
                      )}`}
                    >
                      {deal.stage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{deal.probability}%</div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deal.owner.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString("de-DE")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

