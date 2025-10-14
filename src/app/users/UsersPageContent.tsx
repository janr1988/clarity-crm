"use client";

import { useState, useEffect } from "react";
import TeamMemberCard from "@/components/TeamMemberCard";
import { getWeekStart } from "@/lib/capacityUtils";

interface DealStats {
  totalRevenue: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  team?: { name: string } | null;
  _count: {
    tasksAssigned: number;
    activities: number;
    callNotes: number;
  };
  dealStats: DealStats;
}

interface CapacityInfo {
  userId: string;
  currentWeekItems: number;
  maxItemsPerWeek: number;
  availableSlots: number;
  capacityPercentage: number;
  status: "available" | "moderate" | "full" | "overloaded";
}

interface UsersPageContentProps {
  users: User[];
  teamId: string;
}

export default function UsersPageContent({ users, teamId }: UsersPageContentProps) {
  const [capacityData, setCapacityData] = useState<Record<string, CapacityInfo>>({});
  const [loading, setLoading] = useState(false); // Start with false to avoid blocking

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <TeamMemberCard
          key={user.id}
          user={user}
          capacityInfo={undefined} // Temporarily disable capacity data
        />
      ))}
    </div>
  );
}
