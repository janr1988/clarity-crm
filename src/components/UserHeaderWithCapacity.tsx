"use client";

import { useState, useEffect } from "react";
import { getInitials, getCapacityStatusColor } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  team: {
    name: string;
  } | null;
}

interface CapacityInfo {
  status: "available" | "moderate" | "full" | "overloaded";
}

interface UserHeaderWithCapacityProps {
  user: User;
  weekStart?: string;
}

export default function UserHeaderWithCapacity({ user, weekStart }: UserHeaderWithCapacityProps) {
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacity();
  }, [user.id, weekStart]);

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const url = weekStart 
        ? `/api/capacity/user/${user.id}?week=${weekStart}`
        : `/api/capacity/user/${user.id}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setCapacity(data);
      }
    } catch (err) {
      console.error("Failed to fetch capacity:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCapacityDisplay = () => {
    if (loading) {
      return { text: "Loading...", color: "text-gray-500" };
    }
    
    if (!capacity) {
      return { text: "Unknown", color: "text-gray-500" };
    }
    
    const statusMap = {
      available: { text: "Available", color: "text-green-600" },
      moderate: { text: "Moderate", color: "text-yellow-600" },
      full: { text: "Full", color: "text-red-600" },
      overloaded: { text: "Overloaded", color: "text-red-700" },
    };
    
    return statusMap[capacity.status] || { text: "Unknown", color: "text-gray-500" };
  };

  const capacityDisplay = getCapacityDisplay();

  return (
    <div className="bg-white p-6 rounded shadow-card">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-medium">
          {getInitials(user.name)}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-600 mt-1">{user.email}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {user.role.replace("_", " ")}
            </span>
            {user.team && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {user.team.name}
              </span>
            )}
            <span className={`px-3 py-1 bg-gray-100 rounded-full text-sm font-medium ${capacityDisplay.color}`}>
              Capacity: {capacityDisplay.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
