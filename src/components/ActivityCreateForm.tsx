"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function ActivityCreateForm({ users }: { users: User[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const durationStr = formData.get("duration") as string;
    
    const data = {
      type: formData.get("type") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string || undefined,
      duration: durationStr ? parseInt(durationStr, 10) : undefined,
      userId: formData.get("userId") as string,
    };

    try {
      const response = await fetch("/api/activities", {
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
          setError(errorData.error || "Failed to create activity");
        }
        return;
      }

      router.push("/activities");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => fieldErrors[fieldName];
  const hasFieldError = (fieldName: string) => !!fieldErrors[fieldName];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Activity Type *
        </label>
        <select
          id="type"
          name="type"
          required
          className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
            hasFieldError('type') 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
        >
          <option value="CALL">📞 Call</option>
          <option value="MEETING">👥 Meeting</option>
          <option value="EMAIL">📧 Email</option>
          <option value="NOTE">📝 Note</option>
          <option value="OTHER">📋 Other</option>
        </select>
        {hasFieldError('type') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('type')}</p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
            hasFieldError('title') 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="e.g., Call with client about Q4 renewal"
        />
        {hasFieldError('title') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('title')}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Add details about this activity..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            Team Member *
          </label>
          <select
            id="userId"
            name="userId"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a team member</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="30"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Logging..." : "Log Activity"}
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

