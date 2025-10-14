import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCallNoteSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(userId && { userId }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      whereClause.createdAt = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    const callNotes = await prisma.callNote.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(callNotes);
  } catch (error) {
    console.error("Error fetching call notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch call notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCallNoteSchema.parse(body);

    const callNote = await prisma.callNote.create({
      data: {
        ...validatedData,
        ...(validatedData.followUpDate && {
          followUpDate: new Date(validatedData.followUpDate),
        }),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(callNote, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating call note:", error);
    return NextResponse.json(
      { error: "Failed to create call note" },
      { status: 500 }
    );
  }
}

