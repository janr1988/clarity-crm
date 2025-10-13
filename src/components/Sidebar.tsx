"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "AI Insights", href: "/insights", icon: "🤖" },
  { name: "Team", href: "/users", icon: "👥" },
  { name: "Tasks", href: "/tasks", icon: "✓" },
  { name: "Activities", href: "/activities", icon: "📋" },
  { name: "Call Notes", href: "/call-notes", icon: "📞" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
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
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
            ST
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Sarah Thompson
            </div>
            <div className="text-xs text-gray-500">Sales Lead</div>
          </div>
        </div>
      </div>
    </div>
  );
}

