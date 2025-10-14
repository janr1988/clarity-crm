"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { isSalesLead } from "@/lib/authorization";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamMemberFilterProps {
  page: string;
}

export default function TeamMemberFilter({ page }: TeamMemberFilterProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current filter from URL or set default based on role
  const currentFilter = searchParams.get('member') || (isSalesLead(session) ? 'all' : 'me');

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        if (response.ok) {
          const users = await response.json();
          setTeamMembers(users);
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamMembers();
  }, []);

  const handleFilterChange = (memberId: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    if (memberId === 'all') {
      newSearchParams.delete('member');
    } else if (memberId === 'me') {
      newSearchParams.set('member', 'me');
    } else {
      newSearchParams.set('member', memberId);
    }

    router.push(`/${page}?${newSearchParams.toString()}`);
  };

  if (loading) {
    return (
      <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent" disabled>
        <option>Loading...</option>
      </select>
    );
  }

  const currentUserId = session?.user?.id;
  const currentUser = teamMembers.find(member => member.id === currentUserId);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="member-filter" className="text-sm font-medium text-gray-700">
        Member:
      </label>
      <select
        id="member-filter"
        value={currentFilter}
        onChange={(e) => handleFilterChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="all">All Members</option>
        <option value="me">Me ({currentUser?.name || 'Current User'})</option>
        {teamMembers
          .filter(member => member.id !== currentUserId)
          .map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
      </select>
    </div>
  );
}
