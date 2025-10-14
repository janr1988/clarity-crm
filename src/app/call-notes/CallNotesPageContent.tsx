"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { TimeFilter as TimeFilterType, getDateRange, getDefaultTimeFilter } from "@/lib/dateUtils";
import TimeFilterComponent from "@/components/TimeFilter";

interface CallNote {
  id: string;
  customerName: string;
  notes: string;
  summary: string | null;
  followUpDate: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

async function getCallNotes(timeFilter: TimeFilterType): Promise<CallNote[]> {
  const { start, end } = getDateRange(timeFilter);
  
  const response = await fetch(`/api/call-notes?start=${start.toISOString()}&end=${end.toISOString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch call notes');
  }
  return response.json();
}

export default function CallNotesPageContent() {
  const searchParams = useSearchParams();
  const timeFilter = (searchParams.get('filter') as TimeFilterType) || getDefaultTimeFilter('call-notes');
  
  const [callNotes, setCallNotes] = useState<CallNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCallNotes() {
      try {
        setLoading(true);
        const callNotesData = await getCallNotes(timeFilter);
        setCallNotes(callNotesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCallNotes();
  }, [timeFilter]);

  const todayCalls = callNotes.filter(
    (note) =>
      new Date(note.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const upcomingFollowUps = callNotes.filter(
    (note) =>
      note.followUpDate && new Date(note.followUpDate) >= new Date()
  ).length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Notes</h1>
          <p className="text-gray-600 mt-1">Track customer calls and interactions</p>
        </div>
        <div className="flex items-center gap-4">
          <TimeFilterComponent page="call-notes" />
          <Link
            href="/call-notes/new"
            className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
          >
            New Call Note
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Total Calls</div>
          <div className="text-3xl font-bold text-gray-900">{callNotes.length}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Today&apos;s Calls</div>
          <div className="text-3xl font-bold text-blue-600">{todayCalls}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Upcoming Follow-ups</div>
          <div className="text-3xl font-bold text-orange-600">{upcomingFollowUps}</div>
        </div>
      </div>

      {/* Call Notes List */}
      <div className="bg-white rounded shadow-card">
        <div className="divide-y divide-gray-200">
          {callNotes.map((note) => (
            <div
              key={note.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{note.customerName}</h3>
                  <Link
                    href={`/users/${note.user.id}`}
                    className="text-sm text-gray-600 hover:text-primary"
                  >
                    {note.user.name}
                  </Link>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(note.createdAt)}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-gray-700">{note.notes}</p>
              </div>

              {note.summary && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">AI Summary</h4>
                  <p className="text-sm text-blue-800">{note.summary}</p>
                </div>
              )}

              {note.followUpDate && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Follow-up:</span>{" "}
                  {formatDateTime(note.followUpDate)}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/call-notes/${note.id}`}
                  className="text-sm text-primary hover:text-primary-dark"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {callNotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No call notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
