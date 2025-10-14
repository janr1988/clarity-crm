"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AuthGuard from "./AuthGuard";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // For login page, don't show sidebar and skip auth guard
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // For all other pages, wrap with auth guard and show sidebar
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {/* Mobile: Add padding for hamburger button */}
          <div className="lg:hidden h-16 flex-shrink-0"></div>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
