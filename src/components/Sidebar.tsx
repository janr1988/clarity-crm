"use client";

import { useState } from "react";
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
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="h-6 w-6 text-gray-700" />
        ) : (
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out",
        // Desktop: Always visible, full width
        "lg:w-64 lg:translate-x-0 lg:static",
        // Tablet: Collapsed to icons only
        "md:w-20 md:translate-x-0 md:static",
        // Mobile: Hidden by default, slide in when open
        "fixed z-40 w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className={cn(
            "flex items-center transition-all duration-300",
            "md:justify-center lg:justify-start"
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <div className={cn(
              "ml-3 transition-all duration-300",
              "md:hidden lg:block"
            )}>
              <h1 className="text-xl font-bold text-gray-900">Clarity</h1>
              <p className="text-xs text-gray-500">CRM</p>
            </div>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                "md:justify-center lg:justify-start", // Center on tablet
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={item.name} // Tooltip for tablet (icons only)
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors flex-shrink-0",
                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className={cn(
                "ml-3 truncate transition-all duration-300",
                "md:hidden lg:block" // Hide text on tablet
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {session?.user ? (
          <>
            <div className={cn(
              "flex items-center px-3 py-3 mb-2 bg-gray-50 rounded-lg transition-all duration-300",
              "md:justify-center lg:justify-start"
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-sm font-medium shadow-sm flex-shrink-0">
                {getInitials(session.user.name)}
              </div>
              <div className={cn(
                "ml-3 flex-1 min-w-0 transition-all duration-300",
                "md:hidden lg:block"
              )}>
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
              className={cn(
                "w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200",
                "md:justify-center lg:justify-start"
              )}
              title="Abmelden"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
              <span className={cn(
                "ml-2 transition-all duration-300",
                "md:hidden lg:block"
              )}>
                Abmelden
              </span>
            </button>
          </>
        ) : (
          <div className={cn(
            "px-3 py-3 transition-all duration-300",
            "md:text-center lg:text-center"
          )}>
            <div className={cn(
              "text-xs text-gray-500 mb-3 transition-all duration-300",
              "md:hidden lg:block"
            )}>
              Nicht angemeldet
            </div>
            <Link
              href="/login"
              className={cn(
                "inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm",
                "md:justify-center lg:justify-start"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                "md:hidden lg:block"
              )}>
                Anmelden
              </span>
              <UserIcon className={cn(
                "h-5 w-5 transition-all duration-300",
                "hidden md:block lg:hidden"
              )} />
            </Link>
          </div>
        )}
      </div>
    </div>
    </>
  );
}