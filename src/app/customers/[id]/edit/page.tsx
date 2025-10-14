"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { updateCustomerSchema } from "@/lib/validation";

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
  companyId?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  size?: string;
}

interface User {
  id: string;
  name: string;
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    status: "LEAD",
    source: "WEBSITE",
    value: "",
    notes: "",
    assignedTo: "",
    companyId: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchCustomer(params.id as string);
      fetchCompanies();
      fetchUsers();
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
      
      // Populate form with existing data
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        company: data.company || "",
        position: data.position || "",
        status: data.status || "LEAD",
        source: data.source || "WEBSITE",
        value: data.value ? data.value.toString() : "",
        notes: data.notes || "",
        assignedTo: data.assignedTo || "",
        companyId: data.companyId || "",
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Prepare data for validation
      const submitData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        assignedTo: formData.assignedTo || undefined,
        companyId: formData.companyId || undefined,
      };

      // Remove empty strings
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === "") {
          delete submitData[key as keyof typeof submitData];
        }
      });

      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update customer");
      }

      setSuccess("Customer updated successfully!");
      setTimeout(() => {
        router.push(`/customers/${params.id}`);
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
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

  if (error && !customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error}
          </h1>
          <Link
            href="/customers"
            className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href={`/customers/${customer.id}`}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              ←
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Customer
              </h1>
              <p className="text-gray-600 mt-1">{customer.name}</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Company & Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Company & Status
              </h2>

              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name (if not in list)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="LEAD">Lead</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="WEBSITE">Website</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="SOCIAL_MEDIA">Social Media</option>
                  <option value="COLD_CALL">Cold Call</option>
                  <option value="EMAIL">Email</option>
                  <option value="TRADE_SHOW">Trade Show</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                  Opportunity Value (€)
                </label>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Assignment
            </h2>
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assign to
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notes
            </h2>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Add any additional notes about this customer..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <Link
              href={`/customers/${customer.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
