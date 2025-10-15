import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { Session } from "next-auth";

/**
 * Requires authentication for an API route
 * Returns the session if authenticated, throws error otherwise
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const session = await requireAuth();
 *   const userId = session.user.id;
 *   // ... rest of handler
 * }
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw Errors.unauthorized();
  }
  
  return session;
}

/**
 * Optional authentication - returns session if available, null otherwise
 * Useful for routes that work with or without auth but provide different data
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const session = await optionalAuth();
 *   const userId = session?.user.id;
 *   // ... rest of handler
 * }
 */
export async function optionalAuth(): Promise<Session | null> {
  return await getServerSession(authOptions);
}

/**
 * Requires specific role(s) for an API route
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   const session = await requireRole(['SALES_LEAD', 'MANAGER']);
 *   // ... rest of handler
 * }
 */
export async function requireRole(
  allowedRoles: string[]
): Promise<Session> {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role)) {
    throw Errors.forbidden(
      `This action requires one of the following roles: ${allowedRoles.join(", ")}`
    );
  }
  
  return session;
}

/**
 * Checks if the authenticated user owns the resource
 * Useful for ensuring users can only modify their own data
 * 
 * @example
 * export async function PATCH(
 *   request: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   await requireOwnership(params.id, ['SALES_LEAD']); // Sales leads can edit anyone
 *   // ... rest of handler
 * }
 */
export async function requireOwnership(
  resourceUserId: string,
  exemptRoles: string[] = ["SALES_LEAD", "MANAGER"]
): Promise<Session> {
  const session = await requireAuth();
  
  // Check if user has an exempt role
  if (exemptRoles.includes(session.user.role)) {
    return session;
  }
  
  // Check if user owns the resource
  if (session.user.id !== resourceUserId) {
    throw Errors.forbidden("You can only modify your own resources");
  }
  
  return session;
}

/**
 * API Response wrapper for consistent response format
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * Creates a success response
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"]
): ApiResponse<T> {
  return {
    data,
    ...(meta && { meta }),
  };
}

/**
 * Parse pagination parameters from request
 * 
 * @example
 * const { page, limit, skip } = getPagination(request);
 * const items = await prisma.task.findMany({
 *   skip,
 *   take: limit,
 * });
 */
export function getPagination(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse sort parameters from request
 * 
 * @example
 * const { sortBy, sortOrder } = getSort(request, 'createdAt', 'desc');
 * const items = await prisma.task.findMany({
 *   orderBy: { [sortBy]: sortOrder },
 * });
 */
export function getSort(
  request: Request,
  defaultSortBy = "createdAt",
  defaultSortOrder: "asc" | "desc" = "desc"
) {
  const url = new URL(request.url);
  const sortBy = url.searchParams.get("sortBy") || defaultSortBy;
  const sortOrder = (url.searchParams.get("sortOrder") || defaultSortOrder) as "asc" | "desc";

  return { sortBy, sortOrder };
}

/**
 * Validates that all referenced entities exist
 * Useful for preventing foreign key constraint errors
 * 
 * @example
 * await validateReferences({
 *   userId: data.assigneeId,
 *   customerId: data.customerId,
 * });
 */
export async function validateReferences(refs: {
  userId?: string;
  customerId?: string;
  companyId?: string;
  teamId?: string;
  taskId?: string;
  dealId?: string;
}) {
  const { prisma } = await import("@/lib/prisma");
  const errors: Array<{ field: string; message: string }> = [];

  if (refs.userId) {
    const user = await prisma.user.findUnique({ 
      where: { id: refs.userId },
      select: { id: true }
    });
    if (!user) {
      errors.push({ field: "userId", message: "User not found" });
    }
  }

  if (refs.customerId) {
    const customer = await prisma.customer.findUnique({ 
      where: { id: refs.customerId },
      select: { id: true }
    });
    if (!customer) {
      errors.push({ field: "customerId", message: "Customer not found" });
    }
  }

  if (refs.companyId) {
    const company = await prisma.company.findUnique({ 
      where: { id: refs.companyId },
      select: { id: true }
    });
    if (!company) {
      errors.push({ field: "companyId", message: "Company not found" });
    }
  }

  if (refs.teamId) {
    const team = await prisma.team.findUnique({ 
      where: { id: refs.teamId },
      select: { id: true }
    });
    if (!team) {
      errors.push({ field: "teamId", message: "Team not found" });
    }
  }

  if (refs.taskId) {
    const task = await prisma.task.findUnique({ 
      where: { id: refs.taskId },
      select: { id: true }
    });
    if (!task) {
      errors.push({ field: "taskId", message: "Task not found" });
    }
  }

  if (refs.dealId) {
    const deal = await prisma.deal.findUnique({ 
      where: { id: refs.dealId },
      select: { id: true }
    });
    if (!deal) {
      errors.push({ field: "dealId", message: "Deal not found" });
    }
  }

  if (errors.length > 0) {
    throw Errors.badRequest("Validation failed", errors);
  }
}

