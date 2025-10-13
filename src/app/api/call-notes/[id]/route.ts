import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateCallNoteSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const callNote = await prisma.callNote.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!callNote) {
      return NextResponse.json(
        { error: "Call note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(callNote);
  } catch (error) {
    console.error("Error fetching call note:", error);
    return NextResponse.json(
      { error: "Failed to fetch call note" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateCallNoteSchema.parse(body);

    const callNote = await prisma.callNote.update({
      where: { id: params.id },
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

    return NextResponse.json(callNote);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating call note:", error);
    return NextResponse.json(
      { error: "Failed to update call note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.callNote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting call note:", error);
    return NextResponse.json(
      { error: "Failed to delete call note" },
      { status: 500 }
    );
  }
}

