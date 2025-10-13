"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
// Using emoji instead of heroicons
import CompanyCard from "@/components/CompanyCard";
import { Company } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function CompaniesPage() {
  const { data: session } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (industryFilter) params.append("industry", industryFilter);
        if (sizeFilter) params.append("size", sizeFilter);
        if (statusFilter) params.append("status", statusFilter);
        
        const response = await fetch(`/api/companies?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCompanies(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (session) {
      fetchCompanies();
    }
  }, [session, industryFilter, sizeFilter, statusFilter]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusCounts = companies.reduce((acc, company) => {
    const status = company.status || "UNKNOWN";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sizeCounts = companies.reduce((acc, company) => {
    const size = company.size || "UNKNOWN";
    acc[size] = (acc[size] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Companies</h2>
        <div className="text-gray-600">Loading companies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Companies</h2>
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <Link
          href="/companies/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <span className="mr-2">➕</span>
          New Company
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Companies</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{statusCounts.ACTIVE || 0}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.PROSPECT || 0}</div>
          <div className="text-sm text-gray-600">Prospects</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{statusCounts.PARTNER || 0}</div>
          <div className="text-sm text-gray-600">Partners</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Search companies..."
            />
          </div>
          
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              id="industry"
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Industries</option>
              <option value="TECHNOLOGY">Technology</option>
              <option value="FINANCE">Finance</option>
              <option value="HEALTHCARE">Healthcare</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="RETAIL">Retail</option>
              <option value="EDUCATION">Education</option>
              <option value="ENERGY">Energy</option>
              <option value="AUTOMOTIVE">Automotive</option>
              <option value="AEROSPACE">Aerospace</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="FOOD_BEVERAGE">Food & Beverage</option>
              <option value="PHARMACEUTICALS">Pharmaceuticals</option>
              <option value="TELECOMMUNICATIONS">Telecommunications</option>
              <option value="MEDIA">Media</option>
              <option value="TRANSPORTATION">Transportation</option>
            </select>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              id="size"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Sizes</option>
              <option value="STARTUP">Startup</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="LARGE">Large</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="PARTNER">Partner</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Company Cards */}
      {filteredCompanies.length === 0 ? (
        <div className="text-gray-600">
          {companies.length === 0 ? "No companies found." : "No companies match your search criteria."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
