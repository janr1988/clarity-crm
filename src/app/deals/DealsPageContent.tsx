"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterComponent from "@/components/TimeFilter";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  createdAt: Date;
  owner: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
  } | null;
  company: {
    id: string;
    name: string;
    industry: string;
  } | null;
}

interface DealsData {
  deals: Deal[];
  stats: {
    totalValue: number;
    weightedValue: number;
    dealCount: number;
    wonDeals: number;
    lostDeals: number;
    activeDeals: number;
  };
}

async function getDeals(timeFilter: TimeFilterType): Promise<DealsData> {
  const response = await fetch(`/api/deals?filter=${timeFilter}`);
  if (!response.ok) {
    throw new Error('Failed to fetch deals');
  }
  return response.json();
}

export default function DealsPageContent() {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('deals');
  
  const [data, setData] = useState<DealsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        const dealsData = await getDeals(timeFilter);
        setData(dealsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchDeals();
  }, [timeFilter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
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

  if (!data) return null;

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
        return "bg-gray-100 text-gray-800";
      case "QUALIFICATION":
        return "bg-blue-100 text-blue-800";
      case "PROPOSAL":
        return "bg-yellow-100 text-yellow-800";
      case "NEGOTIATION":
        return "bg-orange-100 text-orange-800";
      case "CLOSED_WON":
        return "bg-green-100 text-green-800";
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals & Opportunities</h1>
          <p className="text-gray-600 mt-1">Manage sales pipeline and opportunities</p>
        </div>
        <div className="flex items-center gap-4">
          <TimeFilterComponent page="deals" />
          <Link
            href="/deals/new"
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            New Deal
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Total Pipeline Value</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">
            {formatCurrency(data.stats.totalValue)}
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Weighted Pipeline</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">
            {formatCurrency(data.stats.weightedValue)}
          </div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Active Deals</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600">{data.stats.activeDeals}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Won Deals</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600">{data.stats.wonDeals}</div>
        </div>
      </div>

      {/* Deals List */}
      <div className="bg-white rounded shadow-card overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-4 xl:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Close Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <td className="px-4 xl:px-6 py-4">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors"
                    >
                      {deal.title}
                    </Link>
                    {deal.customer && (
                      <p className="text-sm text-gray-600 mt-1">{deal.customer.name}</p>
                    )}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    {deal.company ? (
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 mr-3">
                          {getInitials(deal.company.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deal.company.name}
                          </div>
                          <div className="text-sm text-gray-500">{deal.company.industry}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No company</span>
                    )}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium mr-3">
                        {getInitials(deal.owner.name)}
                      </div>
                      <Link
                        href={`/users/${deal.owner.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                      >
                        {deal.owner.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                      {deal.stage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${deal.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tablet View - Compact Table */}
        <div className="hidden lg:block xl:hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  %
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.deals.map((deal) => (
                <tr
                  key={deal.id}
                  className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <td className="px-3 py-3">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-gray-900 hover:text-primary transition-colors text-sm"
                    >
                      {deal.title.length > 20 ? `${deal.title.substring(0, 20)}...` : deal.title}
                    </Link>
                    {deal.customer && (
                      <p className="text-xs text-gray-600 mt-1">{deal.customer.name}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {deal.company ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 mr-2">
                          {getInitials(deal.company.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deal.company.name.length > 15 ? `${deal.company.name.substring(0, 15)}...` : deal.company.name}
                          </div>
                          <div className="text-xs text-gray-500">{deal.company.industry}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No company</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium mr-2">
                        {getInitials(deal.owner.name)}
                      </div>
                      <Link
                        href={`/users/${deal.owner.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary transition-colors"
                      >
                        {deal.owner.name.split(' ')[0]}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                      {deal.stage.replace("_", " ").substring(0, 4)}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${deal.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-600">
                    {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {data.deals.map((deal) => (
            <div key={deal.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="font-medium text-gray-900 hover:text-primary transition-colors"
                  >
                    {deal.title}
                  </Link>
                  {deal.customer && (
                    <p className="text-sm text-gray-600 mt-1">{deal.customer.name}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
                  {deal.stage.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-600">Company</div>
                  <div className="font-medium text-gray-900">
                    {deal.company ? deal.company.name : "No company"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Owner</div>
                  <Link
                    href={`/users/${deal.owner.id}`}
                    className="font-medium text-gray-900 hover:text-primary transition-colors"
                  >
                    {deal.owner.name}
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-sm text-gray-600">Value</div>
                  <div className="font-medium text-gray-900">{formatCurrency(deal.value)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Probability</div>
                  <div className="flex items-center">
                    <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${deal.probability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{deal.probability}%</span>
                  </div>
                </div>
              </div>

              {deal.expectedCloseDate && (
                <div>
                  <div className="text-sm text-gray-600">Close Date</div>
                  <div className="text-sm text-gray-900">{formatDate(deal.expectedCloseDate)}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {data.deals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No deals found</p>
          </div>
        )}
      </div>
    </div>
  );
}
