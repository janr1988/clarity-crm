import { Session } from "next-auth";

/**
 * Authorization Helper Functions
 * These functions check user permissions based on their role
 */

export function isSalesLead(session: Session | null): boolean {
  return session?.user?.role === "SALES_LEAD";
}

export function isSalesAgent(session: Session | null): boolean {
  return session?.user?.role === "SALES_AGENT";
}

/**
 * Check if user can view details of a specific user
 * Sales Lead: Can view all users in their team
 * Sales Agent: Can only view their own profile
 */
export function canViewUserDetails(session: Session | null, targetUserId?: string): boolean {
  if (!session) return false;
  
  // Sales Lead can view all users
  if (isSalesLead(session)) return true;
  
  // Sales Agents can only view their own profile
  if (isSalesAgent(session) && targetUserId && session.user?.id === targetUserId) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can view the user list
 * Only Sales Leads can view all users
 */
export function canViewUserList(session: Session | null): boolean {
  return isSalesLead(session);
}

/**
 * Check if user can access AI Insights
 * Only Sales Leads can access AI insights
 */
export function canViewAIInsights(session: Session | null): boolean {
  return isSalesLead(session);
}

/**
 * Check if user can view team performance metrics
 * Only Sales Leads can view team-wide KPIs
 */
export function canViewTeamPerformance(session: Session | null): boolean {
  return isSalesLead(session);
}

/**
 * Check if user can manage other users (create, update, delete)
 * Only Sales Leads can manage users
 */
export function canManageUsers(session: Session | null): boolean {
  return isSalesLead(session);
}

/**
 * Check if user can reassign tasks/customers from other users
 * Only Sales Leads can reassign work
 */
export function canReassignWork(session: Session | null): boolean {
  return isSalesLead(session);
}

