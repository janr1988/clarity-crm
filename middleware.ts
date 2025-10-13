// Temporarily disable middleware to debug the issue
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Only protect specific routes, not everything
    "/users/:path*",
    "/tasks/:path*",
    "/activities/:path*",
    "/call-notes/:path*",
    "/insights/:path*",
  ],
};

