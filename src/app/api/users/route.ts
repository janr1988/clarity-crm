import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");
    const isActive = searchParams.get("isActive");

    const users = await prisma.user.findMany({
      where: {
        ...(teamId && { teamId }),
        ...(isActive !== null && { isActive: isActive === "true" }),
      },
      include: {
        team: true,
        _count: {
          select: {
            tasksAssigned: true,
            activities: true,
            callNotes: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    const user = await prisma.user.create({
      data: validatedData,
      include: {
        team: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

