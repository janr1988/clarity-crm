"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { isSalesLead } from "@/lib/authorization";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/", icon: "📊" },
      { name: "Deals", href: "/deals", icon: "💼" },
      { name: "Companies", href: "/companies", icon: "🏢" },
      { name: "Customers", href: "/customers", icon: "👤" },
      { name: "Tasks", href: "/tasks", icon: "✓" },
      { name: "Activities", href: "/activities", icon: "📋" },
      { name: "Call Notes", href: "/call-notes", icon: "📞" },
    ];

    // Sales Lead gets additional menu items
    if (isSalesLead(session)) {
      return [
        commonItems[0], // Dashboard
        { name: "KPIs", href: "/kpis", icon: "📈" },
        { name: "AI Insights", href: "/insights", icon: "🤖" },
        { name: "Team", href: "/users", icon: "👥" },
        ...commonItems.slice(1), // Rest of common items
      ];
    }

    // Sales Agent gets "My Profile" instead of "Team"
    return [
      ...commonItems,
      { 
        name: "My Profile", 
        href: session?.user?.id ? `/users/${session.user.id}` : "/users", 
        icon: "👤" 
      },
    ];
  };

  const navigation = getNavigationItems();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">Clarity</h1>
        <p className="text-sm text-gray-600 mt-1">CRM</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {session?.user ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
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
              className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Abmelden
            </button>
          </>
        ) : (
          <div className="px-4 py-3 text-center">
            <div className="text-xs text-gray-500 mb-2">Nicht angemeldet</div>
            <Link
              href="/login"
              className="inline-block px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors"
            >
              Anmelden
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

