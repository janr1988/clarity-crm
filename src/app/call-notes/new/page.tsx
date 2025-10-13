import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CallNoteCreateForm from "@/components/CallNoteCreateForm";

async function getUsers() {
  return await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export default async function NewCallNotePage() {
  const users = await getUsers();

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link
          href="/call-notes"
          className="text-primary hover:text-primary-dark mb-4 inline-block"
        >
          ← Back to Call Notes
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">New Call Note</h1>
        <p className="text-gray-600 mt-1">Record a new call</p>
      </div>

      <div className="bg-white p-6 rounded shadow-card max-w-2xl">
        <CallNoteCreateForm users={users} />
      </div>
    </div>
  );
}

