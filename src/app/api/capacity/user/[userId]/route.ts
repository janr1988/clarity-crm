import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewUserDetails } from "@/lib/authorization";
import { getUserCapacityInfo, getWeekStart } from "@/lib/capacityUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can view this user's details
    if (!canViewUserDetails(session, params.userId)) {
      return NextResponse.json(
        { error: "Forbidden: Cannot view this user's capacity" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const weekParam = searchParams.get("week");

    // Use provided week or current week
    const weekStart = weekParam ? new Date(weekParam) : getWeekStart();

    const userCapacity = await getUserCapacityInfo(params.userId, weekStart);

    if (!userCapacity) {
      return NextResponse.json(
        { error: "User capacity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userCapacity);
  } catch (error) {
    console.error("Error fetching user capacity:", error);
    return NextResponse.json(
      { error: "Failed to fetch user capacity" },
      { status: 500 }
    );
  }
}
