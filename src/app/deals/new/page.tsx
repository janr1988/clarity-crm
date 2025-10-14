"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Company = { id: string; name: string };
type User = { id: string; name: string; email: string };
type Customer = { id: string; name: string; companyId: string };

export default function Page() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[] | null>(null);

  useEffect(() => {
    // Load minimal dependencies for the form
    Promise.all([
      fetch("/api/companies").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, u]) => {
        setCompanies(Array.isArray(c) ? c : []);
        setUsers(Array.isArray(u) ? u : []);
      })
      .catch(() => {
        // Non-fatal for page render; user sees empty dropdowns
      });
  }, []);

  // Load customers when company changes
  useEffect(() => {
    setCustomers([]);
    setSelectedCustomerId("");
    if (!selectedCompanyId) return;
    fetch(`/api/customers?companyId=${encodeURIComponent(selectedCompanyId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => setCustomers([]));
  }, [selectedCompanyId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      value: Number(form.get("value") || 0),
      probability: 50,
      stage: String(form.get("stage") || "PROSPECTING"),
      companyId: String(form.get("companyId") || "").trim() || undefined,
      customerId: String(form.get("customerId") || "").trim() || undefined,
      ownerId: String(form.get("ownerId") || "").trim() || undefined,
    };

    // Frontend guard — require both selections
    if (!payload.companyId || !payload.customerId) {
      setIsLoading(false);
      setError("Please select a company and a customer.");
      return;
    }

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.log("/api/deals error:", data);
        const details: string[] | undefined = Array.isArray(data?.details)
          ? data.details.map((d: any) =>
              typeof d === "string"
                ? d
                : [d.field, d.message].filter(Boolean).join(": ")
            )
          : undefined;
        setError(
          data?.error || "Failed to create deal. Please check your inputs."
        );
        if (details && details.length) setErrorDetails(details);
        return;
      }

      const deal = await res.json();
      router.push(`/deals?created=true&name=${encodeURIComponent(deal.name || 'Deal')}&filter=all`);
    } catch (err: any) {
      setError(err?.message || "Unexpected error while creating deal.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/deals" className="text-primary hover:underline">
          ← Back to Deals
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Create New Deal</h1>
        <p className="text-gray-600 mt-1">Add a new deal opportunity</p>
      </div>

      <div className="bg-white p-6 rounded border border-gray-200 max-w-3xl">
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded">
            <div className="font-medium">{error}</div>
            {errorDetails && (
              <ul className="list-disc pl-5 mt-2 text-sm">
                {errorDetails.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Deal Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enterprise Software License"
              />
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Deal Value (€) *
              </label>
              <input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min={0}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="50000"
              />
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Stage *
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue="PROSPECTING"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="PROSPECTING">Prospecting</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
            </div>

            <div>
              <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <select
                id="companyId"
                name="companyId"
                required
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                id="customerId"
                name="customerId"
                required
                disabled={!selectedCompanyId}
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">{selectedCompanyId ? "Select a customer" : "Select a company first"}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700 mb-1">
                Owner
              </label>
              <select
                id="ownerId"
                name="ownerId"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Auto-assign</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6">
            <Link
              href="/deals"
              className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Deal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


