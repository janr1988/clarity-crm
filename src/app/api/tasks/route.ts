import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");

    const tasks = await prisma.task.findMany({
      where: {
        ...(assigneeId && { assigneeId }),
        ...(status && { status: status as any }),
        ...(teamId && { teamId }),
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { createdById, ...rest } = body;

    // For now, use a default user as createdBy
    // In production, get this from session/auth
    const defaultUser = await prisma.user.findFirst({
      where: { role: "SALES_LEAD" },
    });

    if (!defaultUser) {
      return NextResponse.json(
        { error: "No sales lead found to create task" },
        { status: 400 }
      );
    }

    const validatedData = createTaskSchema.parse(rest);

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
        createdById: createdById || defaultUser.id,
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

