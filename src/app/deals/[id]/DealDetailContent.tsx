"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface Deal {
  id: string;
  name: string;
  description: string | null;
  value: number;
  probability: number;
  stage: string;
  source: string | null;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    address: string | null;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    notes: number;
  };
}

interface DealDetailContentProps {
  dealId: string;
}

export default function DealDetailContent({ dealId }: DealDetailContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/deals/${dealId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deal');
      }
      const data = await response.json();
      setDeal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData: any) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update deal');
      }

      const updatedDeal = await response.json();
      setDeal(updatedDeal);
      setEditing(false);
    } catch (err) {
      console.error('Error updating deal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deal');
      }

      router.push('/deals');
    } catch (err) {
      console.error('Error deleting deal:', err);
    }
  };

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
      case "LEAD":
        return "bg-blue-100 text-blue-800";
      case "QUALIFIED":
        return "bg-yellow-100 text-yellow-800";
      case "PROPOSAL":
        return "bg-orange-100 text-orange-800";
      case "NEGOTIATION":
        return "bg-purple-100 text-purple-800";
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

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-200 rounded-lg h-96 mb-6"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-200 rounded-lg h-48"></div>
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 rounded p-4">
        Deal not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{deal.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(deal.stage)}`}>
              {deal.stage.replace("_", " ")}
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(deal.value)}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{ width: `${deal.probability}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{deal.probability}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                {editing ? (
                  <input
                    type="text"
                    defaultValue={deal.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onBlur={(e) => {
                      if (e.target.value !== deal.name) {
                        handleSave({ name: e.target.value });
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-900">{deal.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                {editing ? (
                  <input
                    type="number"
                    defaultValue={deal.value}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value !== deal.value) {
                        handleSave({ value });
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-900">{formatCurrency(deal.value)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={deal.probability}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onBlur={(e) => {
                      const probability = parseInt(e.target.value);
                      if (!isNaN(probability) && probability !== deal.probability) {
                        handleSave({ probability });
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-900">{deal.probability}%</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                {editing ? (
                  <select
                    defaultValue={deal.stage}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onChange={(e) => {
                      if (e.target.value !== deal.stage) {
                        handleSave({ stage: e.target.value as any });
                      }
                    }}
                  >
                    <option value="PROSPECTING">Prospecting</option>
                    <option value="LEAD">Lead</option>
                    <option value="QUALIFIED">Qualified</option>
                    <option value="PROPOSAL">Proposal</option>
                    <option value="NEGOTIATION">Negotiation</option>
                    <option value="CLOSED_WON">Closed Won</option>
                    <option value="CLOSED_LOST">Closed Lost</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{deal.stage.replace("_", " ")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                {editing ? (
                  <input
                    type="date"
                    defaultValue={deal.expectedCloseDate ? deal.expectedCloseDate.toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onBlur={(e) => {
                      const date = e.target.value ? e.target.value : null;
                      if (date !== (deal.expectedCloseDate?.toISOString().split('T')[0] || null)) {
                        handleSave({ expectedCloseDate: date });
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-900">
                    {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                {editing ? (
                  <input
                    type="text"
                    defaultValue={deal.source || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    onBlur={(e) => {
                      if (e.target.value !== (deal.source || '')) {
                        handleSave({ source: e.target.value || null });
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-900">{deal.source || 'Not specified'}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              {editing ? (
                <textarea
                  defaultValue={deal.description || ''}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  onBlur={(e) => {
                    if (e.target.value !== (deal.description || '')) {
                      handleSave({ description: e.target.value || null });
                    }
                  }}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">
                  {deal.description || 'No description provided'}
                </p>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes ({deal._count.notes})</h2>
            <div className="space-y-4">
              {deal.notes.map((note) => (
                <div key={note.id} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{note.user.name}</span>
                    <span className="text-sm text-gray-500">{formatDateTime(note.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {deal.notes.length === 0 && (
                <p className="text-gray-500 text-center py-4">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                {getInitials(deal.owner.name)}
              </div>
              <div>
                <Link
                  href={`/users/${deal.owner.id}`}
                  className="font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {deal.owner.name}
                </Link>
                <p className="text-sm text-gray-600">{deal.owner.email}</p>
                <p className="text-xs text-gray-500">{deal.owner.role.replace("_", " ")}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {deal.customer && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
              <div className="space-y-2">
                <Link
                  href={`/customers/${deal.customer.id}`}
                  className="font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {deal.customer.name}
                </Link>
                {deal.customer.email && (
                  <p className="text-sm text-gray-600">{deal.customer.email}</p>
                )}
                {deal.customer.phone && (
                  <p className="text-sm text-gray-600">{deal.customer.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Company Information */}
          {deal.company && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Company</h3>
              <div className="space-y-2">
                <Link
                  href={`/companies/${deal.company.id}`}
                  className="font-medium text-gray-900 hover:text-primary transition-colors"
                >
                  {deal.company.name}
                </Link>
                {deal.company.industry && (
                  <p className="text-sm text-gray-600">{deal.company.industry}</p>
                )}
                {deal.company.website && (
                  <a
                    href={deal.company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {deal.company.website}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Deal Metadata */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{formatDateTime(deal.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-600">Last updated:</span>
                <span className="ml-2 text-gray-900">{formatDateTime(deal.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
