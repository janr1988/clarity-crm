import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(userId && { userId }),
      ...(type && { type: type as any }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      whereClause.createdAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    const activity = await prisma.activity.create({
      data: validatedData,
      include: {
        user: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}

