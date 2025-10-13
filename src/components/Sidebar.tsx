"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { isSalesLead } from "@/lib/authorization";
import {
  ChartBarIcon,
  ChartBarSquareIcon,
  CpuChipIcon,
  UsersIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/", icon: ChartBarIcon },
      { name: "Deals", href: "/deals", icon: BriefcaseIcon },
      { name: "Companies", href: "/companies", icon: BuildingOfficeIcon },
      { name: "Customers", href: "/customers", icon: UserIcon },
      { name: "Tasks", href: "/tasks", icon: CheckIcon },
      { name: "Activities", href: "/activities", icon: ClipboardDocumentListIcon },
      { name: "Call Notes", href: "/call-notes", icon: PhoneIcon },
    ];

    // Sales Lead gets additional menu items
    if (isSalesLead(session)) {
      return [
        commonItems[0], // Dashboard
        { name: "KPIs", href: "/kpis", icon: ChartBarSquareIcon },
        { name: "AI Insights", href: "/insights", icon: CpuChipIcon },
        { name: "Team", href: "/users", icon: UsersIcon },
        ...commonItems.slice(1), // Rest of common items
      ];
    }

    // Sales Agent gets "My Profile" instead of "Team"
    return [
      ...commonItems,
      { 
        name: "My Profile", 
        href: session?.user?.id ? `/users/${session.user.id}` : "/users", 
        icon: UserIcon 
      },
    ];
  };

  const navigation = getNavigationItems();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clarity</h1>
            <p className="text-xs text-gray-500">CRM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {session?.user ? (
          <>
            <div className="flex items-center space-x-3 px-3 py-3 mb-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-medium shadow-sm">
                {getInitials(session.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {session.user.role.replace("_", " ")}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Abmelden</span>
            </button>
          </>
        ) : (
          <div className="px-3 py-3 text-center">
            <div className="text-xs text-gray-500 mb-3">Nicht angemeldet</div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <span>Anmelden</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}