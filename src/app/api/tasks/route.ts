import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";
import { withRequestLogging } from "@/lib/request-logger";
import { logger } from "@/lib/logger";
import { rateLimiters } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const teamId = searchParams.get("teamId");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const whereClause: any = {
      ...(assigneeId && { assigneeId }),
      ...(status && { status: status as any }),
      ...(teamId && { teamId }),
    };

    // Add date filtering if start and end are provided
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Determine if this is an upcoming view (future dates or very recent past)
      // Allow for a 5-minute buffer to account for API call timing
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      const isUpcomingView = startDate >= bufferTime;
      
      if (isUpcomingView) {
        // For upcoming views, filter by dueDate
        whereClause.dueDate = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        // For past views, filter by createdAt
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = rateLimiters.api(async (request: NextRequest) => {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Validate foreign keys if provided
    if (validatedData.assigneeId || validatedData.teamId) {
      await validateReferences({
        userId: validatedData.assigneeId,
        teamId: validatedData.teamId,
      });
    }

    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        status: validatedData.status,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assigneeId: validatedData.assigneeId || null,
        teamId: validatedData.teamId || null,
        createdById: session.user.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

