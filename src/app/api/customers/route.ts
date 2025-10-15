import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCustomerSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");
    const companyId = searchParams.get("companyId");
    const search = searchParams.get("search");

    const customers = await prisma.customer.findMany({
      where: {
        ...(status && { status }),
        ...(assignedTo && { assignedTo }),
        ...(companyId && { companyId }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { company: { contains: search } },
            { email: { contains: search } },
            { companyRef: { is: { name: { contains: search } } } },
          ],
        }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        companyRef: {
          select: { id: true, name: true, industry: true, size: true },
        },
        _count: {
          select: {
            activities: true,
            callNotes: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createCustomerSchema.parse(body);

    // Validate foreign keys if provided
    if (validatedData.assignedTo) {
      await validateReferences({
        userId: validatedData.assignedTo,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: validatedData.name,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        company: validatedData.company || null,
        position: validatedData.position || null,
        status: validatedData.status,
        source: validatedData.source || null,
        value: validatedData.value || null,
        notes: validatedData.notes || null,
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
        companyRef: {
          select: { id: true, name: true, industry: true, size: true },
        },
        _count: {
          select: {
            activities: true,
            callNotes: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
