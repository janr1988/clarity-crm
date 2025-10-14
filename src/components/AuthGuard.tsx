"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [status]);

  useEffect(() => {
    // Don't redirect if we're still loading
    if (status === "loading") return;

    // Allow access to login page without authentication
    if (pathname === "/login") return;

    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [session, status, router, pathname]);

  // Show loading while checking authentication, but with timeout
  if (status === "loading" && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-gray-600">Laden...</div>
        </div>
      </div>
    );
  }

  // If loading timeout reached, redirect to login
  if (loadingTimeout && status === "loading") {
    router.push("/login");
    return null;
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === "unauthenticated") {
    return null;
  }

  // Render children for authenticated users
  return <>{children}</>;
}
