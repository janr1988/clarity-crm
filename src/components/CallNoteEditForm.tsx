"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CallNote {
  id: string;
  clientName: string;
  clientCompany: string | null;
  phoneNumber: string | null;
  notes: string;
  summary: string | null;
  aiSummary: string | null;
  outcome: string | null;
  followUpDate: Date | null;
}

export default function CallNoteEditForm({ callNote }: { callNote: CallNote }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      clientName: formData.get("clientName") as string,
      clientCompany: formData.get("clientCompany") as string || null,
      phoneNumber: formData.get("phoneNumber") as string || null,
      notes: formData.get("notes") as string,
      summary: formData.get("summary") as string || null,
      outcome: formData.get("outcome") as string || null,
      followUpDate: formData.get("followUpDate") as string || null,
    };

    try {
      const response = await fetch(`/api/call-notes/${callNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update call note");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update call note");
    } finally {
      setIsSubmitting(false);
    }
  };

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

    // Simulate AI summary generation
    setTimeout(() => {
      const words = notes.split(" ");
      const summary = words.slice(0, 15).join(" ") + (words.length > 15 ? "..." : "");
      summaryElement.value = summary;
      setIsGeneratingAI(false);
    }, 1000);
  };

  const formatDateTimeLocal = (date: Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
            defaultValue={callNote.clientName}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="clientCompany" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            id="clientCompany"
            name="clientCompany"
            defaultValue={callNote.clientCompany || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          defaultValue={callNote.phoneNumber || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
        />
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
          defaultValue={callNote.notes}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
        />
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
          defaultValue={callNote.summary || ""}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            defaultValue={callNote.outcome || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
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
            defaultValue={formatDateTimeLocal(callNote.followUpDate)}
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
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

