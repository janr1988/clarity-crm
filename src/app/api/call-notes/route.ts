import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCallNoteSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

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
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createCallNoteSchema.parse(body);

    // Validate foreign keys if provided
    await validateReferences({
      userId: validatedData.userId,
      customerId: body.customerId,
    });

    const callNote = await prisma.callNote.create({
      data: {
        clientName: validatedData.clientName,
        clientCompany: validatedData.clientCompany || null,
        phoneNumber: validatedData.phoneNumber || null,
        notes: validatedData.notes,
        summary: validatedData.summary || null,
        outcome: validatedData.outcome || null,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        userId: validatedData.userId,
        customerId: body.customerId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(callNote, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

