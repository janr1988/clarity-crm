import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validation";
import { ZodError } from "zod";
import { requireAuth } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Check if task exists and user has permission to edit
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true, assigneeId: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Check if user can edit this task (creator or assignee)
    const canEdit = existingTask.createdById === session.user.id || 
                   existingTask.assigneeId === session.user.id;
    
    if (!canEdit) {
      return NextResponse.json({ error: "You don't have permission to edit this task" }, { status: 403 });
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate) }),
      },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    // Check if task exists and user has permission to delete
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, createdById: true }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Only the creator can delete the task
    if (existingTask.createdById !== session.user.id) {
      return NextResponse.json({ error: "You don't have permission to delete this task" }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

