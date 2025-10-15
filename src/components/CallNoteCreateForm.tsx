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

export default function CallNoteCreateForm({ users }: { users: User[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const rawFollowUp = (formData.get("followUpDate") as string) || "";
    const normalizedFollowUp = rawFollowUp ? new Date(rawFollowUp).toISOString() : undefined;

    const data = {
      clientName: formData.get("clientName") as string,
      clientCompany: (formData.get("clientCompany") as string) || undefined,
      phoneNumber: (formData.get("phoneNumber") as string) || undefined,
      notes: formData.get("notes") as string,
      summary: (formData.get("summary") as string) || undefined,
      outcome: (formData.get("outcome") as string) || undefined,
      followUpDate: normalizedFollowUp,
      userId: formData.get("userId") as string,
    };

    try {
      const response = await fetch("/api/call-notes", {
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
          setError(errorData.error || "Failed to create call note");
        }
        return;
      }

      const callNote = await response.json();
      router.push(`/call-notes/${callNote.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create call note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => fieldErrors[fieldName];
  const hasFieldError = (fieldName: string) => !!fieldErrors[fieldName];

  const generateAISummary = async () => {
    setIsGeneratingAI(true);
    const notesElement = document.getElementById("notes") as HTMLTextAreaElement;
    const summaryElement = document.getElementById("summary") as HTMLInputElement;
    
    const notes = notesElement.value;
    
    if (!notes.trim()) {
      setError("Please add call notes before generating a summary");
      setIsGeneratingAI(false);
      return;
    }

    // Simulate AI summary generation (in production, call an AI API)
    setTimeout(() => {
      const words = notes.split(" ");
      const summary = words.slice(0, 15).join(" ") + (words.length > 15 ? "..." : "");
      summaryElement.value = summary;
      setIsGeneratingAI(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            required
            className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFieldError('clientName') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
          />
          {hasFieldError('clientName') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('clientName')}</p>
          )}
        </div>

        <div>
          <label htmlFor="clientCompany" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            id="clientCompany"
            name="clientCompany"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+1-555-0123"
          />
        </div>

        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
            Sales Rep *
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
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Call Notes *
        </label>
        <textarea
          id="notes"
          name="notes"
          required
          rows={6}
          className={`w-full px-4 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent ${
            hasFieldError('notes') 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
          }`}
          placeholder="Detailed notes from the call..."
        />
        {hasFieldError('notes') && (
          <p className="mt-1 text-sm text-red-600">{getFieldError('notes')}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
            Summary
          </label>
          <button
            type="button"
            onClick={generateAISummary}
            disabled={isGeneratingAI}
            className="text-sm text-primary hover:text-primary-dark font-medium disabled:opacity-50"
          >
            {isGeneratingAI ? "🤖 Generating..." : "🤖 Generate AI Summary"}
          </button>
        </div>
        <input
          type="text"
          id="summary"
          name="summary"
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Brief summary of the call"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-1">
            Outcome
          </label>
          <input
            type="text"
            id="outcome"
            name="outcome"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., Demo scheduled, Follow-up needed"
          />
        </div>

        <div>
          <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700 mb-1">
            Follow-up Date
          </label>
          <input
            type="datetime-local"
            id="followUpDate"
            name="followUpDate"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : "Save Call Note"}
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

