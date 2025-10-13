"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // For login page, don't show sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // For all other pages, show sidebar
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
