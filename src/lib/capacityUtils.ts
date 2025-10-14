import { prisma } from "@/lib/prisma";

export interface CapacityInfo {
  userId: string;
  userName: string;
  maxItemsPerWeek: number;
  currentWeekItems: number;
  availableSlots: number;
  capacityPercentage: number;
  status: "available" | "moderate" | "full" | "overloaded";
  workingDays: string[];
  workingHours: {
    start: number;
    end: number;
  };
}

export interface WeeklyCapacity {
  weekStart: Date;
  weekEnd: Date;
  teamCapacity: CapacityInfo[];
  totalTeamCapacity: number;
  totalTeamUsage: number;
  teamCapacityPercentage: number;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date = new Date()): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Get the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekEnd = new Date(date);
  const day = weekEnd.getDay();
  
  // Calculate days to add to reach Sunday (end of week)
  // Sunday = 0, Monday = 1, ..., Saturday = 6
  // To get to Sunday: add (7 - day) days
  // If it's already Sunday (day === 0), we want the same day (end of current week)
  const daysToAdd = day === 0 ? 0 : 7 - day;
  weekEnd.setDate(weekEnd.getDate() + daysToAdd);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Get capacity information for a specific user and week
 */
export async function getUserCapacityInfo(
  userId: string,
  weekStart?: Date
): Promise<CapacityInfo | null> {
  const startOfWeek = weekStart || getWeekStart();
  const endOfWeek = getWeekEnd(startOfWeek);

  // Get user and capacity settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { capacity: true },
  });

  if (!user || !user.capacity) {
    return null;
  }

  // Get current week's tasks based on due date
  console.log(`=== getUserCapacityInfo DEBUG for ${userId} ===`);
  console.log(`startOfWeek: ${startOfWeek.toISOString()}`);
  console.log(`endOfWeek: ${endOfWeek.toISOString()}`);
  console.log(`Looking for tasks between ${startOfWeek.toISOString()} and ${endOfWeek.toISOString()}`);
  
  const currentWeekTasks = await prisma.task.count({
    where: {
      assigneeId: userId,
      dueDate: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
      status: {
        in: ["TODO", "IN_PROGRESS"], // Only count active tasks
      },
    },
  });
  
  console.log(`Found ${currentWeekTasks} tasks for user ${userId}`);
  console.log(`=== END getUserCapacityInfo DEBUG ===`);

  const currentWeekItems = currentWeekTasks;
  const availableSlots = Math.max(0, user.capacity.maxItemsPerWeek - currentWeekItems);
  const capacityPercentage = (currentWeekItems / user.capacity.maxItemsPerWeek) * 100;

  let status: CapacityInfo["status"] = "available";
  if (capacityPercentage >= 100) {
    status = currentWeekItems > user.capacity.maxItemsPerWeek ? "overloaded" : "full";
  } else if (capacityPercentage >= 75) {
    status = "moderate";
  }

  return {
    userId: user.id,
    userName: user.name,
    maxItemsPerWeek: user.capacity.maxItemsPerWeek,
    currentWeekItems,
    availableSlots,
    capacityPercentage: Math.round(capacityPercentage),
    status,
    workingDays: user.capacity.workingDays.split(","),
    workingHours: {
      start: user.capacity.workingHoursStart,
      end: user.capacity.workingHoursEnd,
    },
  };
}

/**
 * Get capacity information for all team members for a specific week
 */
export async function getTeamCapacityInfo(
  teamId: string,
  weekStart?: Date
): Promise<WeeklyCapacity> {
  const startOfWeek = weekStart || getWeekStart();
  const endOfWeek = getWeekEnd(startOfWeek);

  // Get all team members
  const teamMembers = await prisma.user.findMany({
    where: {
      teamId: teamId,
      isActive: true,
      role: "SALES_AGENT", // Only count sales agents for capacity
    },
    include: { capacity: true },
  });

  // Get capacity info for each team member
  const teamCapacity = await Promise.all(
    teamMembers
      .filter((member) => member.capacity)
      .map((member) => getUserCapacityInfo(member.id, startOfWeek))
  );

  const validCapacity = teamCapacity.filter((info): info is CapacityInfo => info !== null);

  const totalTeamCapacity = validCapacity.reduce((sum, info) => sum + info.maxItemsPerWeek, 0);
  const totalTeamUsage = validCapacity.reduce((sum, info) => sum + info.currentWeekItems, 0);
  const teamCapacityPercentage = totalTeamCapacity > 0 ? (totalTeamUsage / totalTeamCapacity) * 100 : 0;

  return {
    weekStart: startOfWeek,
    weekEnd: endOfWeek,
    teamCapacity: validCapacity,
    totalTeamCapacity,
    totalTeamUsage,
    teamCapacityPercentage: Math.round(teamCapacityPercentage),
  };
}

/**
 * Check if a user can be assigned a new task/call for a specific week
 */
export async function canAssignToUser(
  userId: string,
  weekStart?: Date
): Promise<{ canAssign: boolean; reason?: string; availableSlots: number }> {
  const capacityInfo = await getUserCapacityInfo(userId, weekStart);
  
  if (!capacityInfo) {
    return { canAssign: false, reason: "User capacity settings not found", availableSlots: 0 };
  }

  if (capacityInfo.availableSlots <= 0) {
    return { 
      canAssign: false, 
      reason: `User is at capacity (${capacityInfo.currentWeekItems}/${capacityInfo.maxItemsPerWeek})`,
      availableSlots: 0
    };
  }

  return { canAssign: true, availableSlots: capacityInfo.availableSlots };
}

/**
 * Get the best available team member for assignment
 */
export async function getBestAvailableMember(
  teamId: string,
  weekStart?: Date
): Promise<{ userId: string; userName: string; availableSlots: number } | null> {
  const teamCapacity = await getTeamCapacityInfo(teamId, weekStart);
  
  // Sort by available slots (descending) and then by current usage (ascending)
  const sortedMembers = teamCapacity.teamCapacity.sort((a, b) => {
    if (a.availableSlots !== b.availableSlots) {
      return b.availableSlots - a.availableSlots; // More available slots first
    }
    return a.currentWeekItems - b.currentWeekItems; // Less current usage first
  });

  const bestMember = sortedMembers[0];
  
  if (!bestMember || bestMember.availableSlots <= 0) {
    return null;
  }

  return {
    userId: bestMember.userId,
    userName: bestMember.userName,
    availableSlots: bestMember.availableSlots,
  };
}

/**
 * Get capacity status color for UI
 */
export function getCapacityStatusColor(status: CapacityInfo["status"]): string {
  switch (status) {
    case "available":
      return "text-green-600 bg-green-50";
    case "moderate":
      return "text-yellow-600 bg-yellow-50";
    case "full":
      return "text-red-600 bg-red-50";
    case "overloaded":
      return "text-red-800 bg-red-100";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

/**
 * Get capacity status icon for UI
 */
export function getCapacityStatusIcon(status: CapacityInfo["status"]): string {
  switch (status) {
    case "available":
      return "✅";
    case "moderate":
      return "⚠️";
    case "full":
      return "🔴";
    case "overloaded":
      return "🚨";
    default:
      return "❓";
  }
}

/**
 * Format capacity percentage for display
 */
export function formatCapacityPercentage(percentage: number): string {
  if (percentage >= 100) {
    return "100%";
  }
  return `${Math.round(percentage)}%`;
}

/**
 * Get capacity progress bar width for UI
 */
export function getCapacityProgressWidth(percentage: number): string {
  return `${Math.min(100, Math.max(0, percentage))}%`;
}
