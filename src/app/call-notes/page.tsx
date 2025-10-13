import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

async function getCallNotes() {
  return await prisma.callNote.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function CallNotesPage() {
  const callNotes = await getCallNotes();

  const todayCalls = callNotes.filter(
    (note) =>
      new Date(note.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const upcomingFollowUps = callNotes.filter(
    (note) =>
      note.followUpDate && new Date(note.followUpDate) >= new Date()
  ).length;

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Notes</h1>
          <p className="text-gray-600 mt-1">Track and manage call records</p>
        </div>
        <Link
          href="/call-notes/new"
          className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary-dark transition-colors"
        >
          New Call Note
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Total Calls</div>
          <div className="text-3xl font-bold text-gray-900">{callNotes.length}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Today&apos;s Calls</div>
          <div className="text-3xl font-bold text-primary">{todayCalls}</div>
        </div>
        <div className="bg-white p-6 rounded shadow-card">
          <div className="text-sm text-gray-600 mb-1">Upcoming Follow-ups</div>
          <div className="text-3xl font-bold text-orange-600">{upcomingFollowUps}</div>
        </div>
      </div>

      {/* Call Notes List */}
      <div className="space-y-4">
        {callNotes.map((note) => (
          <Link
            key={note.id}
            href={`/call-notes/${note.id}`}
            className="block bg-white p-6 rounded shadow-card hover:shadow-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📞</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {note.clientName}
                    </h3>
                    {note.clientCompany && (
                      <p className="text-gray-600 mt-1">{note.clientCompany}</p>
                    )}
                    {note.summary && (
                      <p className="text-gray-700 mt-2">{note.summary}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{note.user.name}</span>
                      <span>•</span>
                      <span>{formatDateTime(note.createdAt)}</span>
                      {note.followUpDate && (
                        <>
                          <span>•</span>
                          <span className="text-orange-600 font-medium">
                            Follow-up: {formatDateTime(note.followUpDate)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {note.outcome && (
                <div className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                  {note.outcome}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {callNotes.length === 0 && (
        <div className="bg-white rounded shadow-card">
          <div className="text-center py-12">
            <p className="text-gray-500">No call notes found</p>
          </div>
        </div>
      )}
    </div>
  );
}

