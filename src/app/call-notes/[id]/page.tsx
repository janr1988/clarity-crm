import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import CallNoteEditForm from "@/components/CallNoteEditForm";

async function getCallNote(id: string) {
  const callNote = await prisma.callNote.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!callNote) {
    notFound();
  }

  return callNote;
}

export default async function CallNoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const callNote = await getCallNote(params.id);

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/call-notes"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Call Notes
        </Link>

        <div className="bg-white p-6 rounded shadow-card">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">📞</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {callNote.clientName}
              </h1>
              {callNote.clientCompany && (
                <p className="text-xl text-gray-600 mt-1">
                  {callNote.clientCompany}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Sales Rep</div>
              <Link
                href={`/users/${callNote.user.id}`}
                className="text-gray-900 font-medium hover:text-primary"
              >
                {callNote.user.name}
              </Link>
            </div>
            {callNote.phoneNumber && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Phone Number</div>
                <a
                  href={`tel:${callNote.phoneNumber}`}
                  className="text-gray-900 font-medium hover:text-primary"
                >
                  {callNote.phoneNumber}
                </a>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600 mb-1">Call Date</div>
              <div className="text-gray-900 font-medium">
                {formatDateTime(callNote.createdAt)}
              </div>
            </div>
            {callNote.followUpDate && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Follow-up Date</div>
                <div className="text-orange-600 font-medium">
                  {formatDateTime(callNote.followUpDate)}
                </div>
              </div>
            )}
          </div>

          {callNote.summary && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Summary</div>
              <p className="text-gray-900 font-medium">{callNote.summary}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Call Notes</div>
            <p className="text-gray-900 whitespace-pre-wrap">{callNote.notes}</p>
          </div>

          {callNote.aiSummary && (
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <div className="text-sm text-blue-600 font-medium mb-2">
                🤖 AI Summary
              </div>
              <p className="text-gray-900">{callNote.aiSummary}</p>
            </div>
          )}

          {callNote.outcome && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Outcome</div>
              <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded">
                {callNote.outcome}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white p-6 rounded shadow-card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Edit Call Note
        </h2>
        <CallNoteEditForm callNote={callNote} />
      </div>
    </div>
  );
}

