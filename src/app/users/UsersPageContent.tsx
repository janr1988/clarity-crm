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
  const [loading, setLoading] = useState(true);
  const [weekStart] = useState(getWeekStart().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTeamCapacity();
  }, [teamId, weekStart]);

  const fetchTeamCapacity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/capacity/team?teamId=${teamId}&week=${weekStart}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Convert array to object keyed by userId
        const capacityMap: Record<string, CapacityInfo> = {};
        data.teamCapacity.forEach((cap: CapacityInfo) => {
          capacityMap[cap.userId] = cap;
        });
        
        setCapacityData(capacityMap);
      }
    } catch (err) {
      console.error("Error fetching capacity data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <TeamMemberCard
          key={user.id}
          user={user}
          capacityInfo={user.role === "SALES_AGENT" ? capacityData[user.id] : undefined}
        />
      ))}
    </div>
  );
}
