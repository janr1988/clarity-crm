import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCompanySchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const industry = searchParams.get("industry");
    const size = searchParams.get("size");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    const companies = await prisma.company.findMany({
      where: {
        ...(industry && { industry }),
        ...(size && { size }),
        ...(status && { status }),
        ...(assignedTo && { assignedTo }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            customers: true,
            activities: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Validate foreign keys if provided
    if (validatedData.assignedTo) {
      await validateReferences({
        userId: validatedData.assignedTo,
      });
    }

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        assignedTo: validatedData.assignedTo || null,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            customers: true,
            activities: true,
            tasks: true,
            deals: true,
          },
        },
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
