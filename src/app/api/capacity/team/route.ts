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
    const weekStart = weekParam ? new Date(weekParam) : getWeekStart();
    
    // Get team ID from session or parameter
    const teamId = teamIdParam || session.user.teamId;
    
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID not found" },
        { status: 400 }
      );
    }

    const teamCapacity = await getTeamCapacityInfo(teamId, weekStart);

    return NextResponse.json(teamCapacity);
  } catch (error) {
    console.error("Error fetching team capacity:", error);
    return NextResponse.json(
      { error: "Failed to fetch team capacity" },
      { status: 500 }
    );
  }
}
