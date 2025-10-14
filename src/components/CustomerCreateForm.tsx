"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ValidationError {
  field: string;
  message: string;
}

interface CustomerCreateFormProps {
  onSuccess?: () => void;
}

export default function CustomerCreateForm({ onSuccess }: CustomerCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      company: formData.get("company") as string || null,
      position: formData.get("position") as string || null,
      status: formData.get("status") as string,
      source: formData.get("source") as string || null,
      value: formData.get("value") ? parseFloat(formData.get("value") as string) : null,
      notes: formData.get("notes") as string || null,
      assignedTo: formData.get("assignedTo") as string || null,
    };

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.details) {
          // Handle Zod validation errors
          const errors: Record<string, string> = {};
          errorData.details.forEach((err: ValidationError) => {
            errors[err.field] = err.message;
          });
          setFieldErrors(errors);
          setError("Please fix the errors below");
        } else {
          setError(errorData.error || "Failed to create customer");
        }
        return;
      }

      const customer = await response.json();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/customers/${customer.id}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => fieldErrors[fieldName];
  const hasFieldError = (fieldName: string) => !!fieldErrors[fieldName];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('name') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="Max Mustermann"
          />
          {hasFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('email') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="max.mustermann@company.com"
          />
          {hasFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('phone') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="+49 123 4567890"
          />
          {hasFieldError('phone') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('phone')}</p>
          )}
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            id="company"
            name="company"
            type="text"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('company') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="TechCorp GmbH"
          />
          {hasFieldError('company') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('company')}</p>
          )}
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <input
            id="position"
            name="position"
            type="text"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('position') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="CEO, CTO, Sales Director..."
          />
          {hasFieldError('position') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('position')}</p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('status') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
          >
            <option value="LEAD">Lead</option>
            <option value="PROSPECT">Prospect</option>
            <option value="CUSTOMER">Customer</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          {hasFieldError('status') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('status')}</p>
          )}
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            id="source"
            name="source"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('source') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
          >
            <option value="">Select source...</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="SOCIAL_MEDIA">Social Media</option>
            <option value="TRADE_SHOW">Trade Show</option>
            <option value="OTHER">Other</option>
          </select>
          {hasFieldError('source') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('source')}</p>
          )}
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Opportunity Value (€)
          </label>
          <input
            id="value"
            name="value"
            type="number"
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('value') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="25000"
          />
          {hasFieldError('value') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('value')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
            hasFieldError('notes') 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="Additional notes about this customer..."
        />
        {hasFieldError('notes') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('notes')}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Creating..." : "Create Customer"}
        </button>
        
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
