import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSalesLead } from "@/lib/authorization";
import { getTeamCapacityInfo, getWeekStart } from "@/lib/capacityUtils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Sales Lead can view team capacity
    if (!isSalesLead(session)) {
      return NextResponse.json(
        { error: "Forbidden: Only Sales Leads can view team capacity" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const weekParam = searchParams.get("week");
    const teamIdParam = searchParams.get("teamId");

    // Use provided week or current week
    let weekStart: Date;
    if (weekParam) {
      // If weekParam is just a date string (YYYY-MM-DD), convert it to a proper Date
      if (weekParam.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Parse as local date to avoid timezone issues
        const [year, month, day] = weekParam.split('-').map(Number);
        weekStart = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        weekStart = new Date(weekParam);
      }
    } else {
      weekStart = getWeekStart();
    }
    
    // Get team ID from session or parameter
    const teamId = teamIdParam || session.user.teamId;
    
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID not found" },
        { status: 400 }
      );
    }

    console.log('=== TEAM CAPACITY API DEBUG ===');
    console.log('API received weekParam:', weekParam);
    console.log('API calculated weekStart:', weekStart.toISOString());
    console.log('API weekStart day of week:', weekStart.getDay());
    console.log('API weekStart getDay() result:', weekStart.getDay());
    
    const teamCapacity = await getTeamCapacityInfo(teamId, weekStart);
    
    console.log('API teamCapacity result weekStart:', teamCapacity.weekStart);
    console.log('API teamCapacity result weekEnd:', teamCapacity.weekEnd);
    console.log('API teamCapacity totalUsage:', teamCapacity.totalTeamUsage);
    console.log('=== END DEBUG ===');

    return NextResponse.json(teamCapacity);
  } catch (error) {
    console.error("Error fetching team capacity:", error);
    return NextResponse.json(
      { error: "Failed to fetch team capacity" },
      { status: 500 }
    );
  }
}
