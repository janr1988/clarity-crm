import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { EnvelopeIcon, PhoneIcon, UserCircleIcon } from "@heroicons/react/24/outline";

interface DealStats {
  totalRevenue: number;
  conversionRate: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
}

interface CapacityInfo {
  currentWeekItems: number;
  maxItemsPerWeek: number;
  availableSlots: number;
  capacityPercentage: number;
  status: "available" | "moderate" | "full" | "overloaded";
}

interface TeamMemberCardProps {
  user: {
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
  };
  capacityInfo?: CapacityInfo | null;
}

export default function TeamMemberCard({ user, capacityInfo }: TeamMemberCardProps) {
  const getCapacityStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "full":
        return "bg-orange-100 text-orange-800";
      case "overloaded":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCapacityBarColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "moderate":
        return "bg-yellow-500";
      case "full":
        return "bg-orange-500";
      case "overloaded":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Link href={`/users/${user.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 h-full flex flex-col">
        {/* Header with Avatar and Name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-semibold">
                {getInitials(user.name)}
              </div>
            )}
            {capacityInfo && (
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${getCapacityStatusColor(
                  capacityInfo.status
                )}`}
                title={`Capacity: ${capacityInfo.status}`}
              >
                <span className="text-xs font-bold">
                  {capacityInfo.status === "available" ? "✓" : 
                   capacityInfo.status === "moderate" ? "!" : 
                   capacityInfo.status === "full" ? "●" : "⚠"}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {user.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
            <span
              className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                user.role === "SALES_LEAD"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {user.role === "SALES_LEAD" ? "Sales Lead" : "Sales Agent"}
            </span>
          </div>
        </div>

        {/* Capacity Indicator */}
        {capacityInfo && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Weekly Capacity
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {capacityInfo.currentWeekItems} / {capacityInfo.maxItemsPerWeek}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${getCapacityBarColor(
                  capacityInfo.status
                )}`}
                style={{ width: `${Math.min(100, capacityInfo.capacityPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {capacityInfo.availableSlots > 0
                ? `${capacityInfo.availableSlots} slots available`
                : "At capacity"}
            </p>
          </div>
        )}

        {/* Deal Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Revenue</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(user.dealStats.totalRevenue)}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Win Rate</p>
            <p className="text-sm font-semibold text-gray-900">
              {user.dealStats.conversionRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Total Deals</p>
            <p className="text-sm font-semibold text-gray-900">
              {user.dealStats.totalDeals}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Won Deals</p>
            <p className="text-sm font-semibold text-green-600">
              {user.dealStats.wonDeals}
            </p>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{user._count.tasksAssigned} Tasks</span>
            <span>{user._count.activities} Activities</span>
            <span>{user._count.callNotes} Calls</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
