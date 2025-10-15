import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDealSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";
import { rateLimiters } from "@/lib/rate-limiter";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const dealId = params.id;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        customer: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            phone: true
          } 
        },
        company: { 
          select: { 
            id: true, 
            name: true, 
            industry: true,
            website: true,
            address: true
          } 
        },
        owner: { 
          select: { 
            id: true, 
            name: true, 
            email: true,
            role: true
          } 
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        _count: { 
          select: { 
            notes: true
          } 
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = rateLimiters.strict(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await requireAuth();
    const dealId = params.id;
    const body = await request.json();
    const validatedData = updateDealSchema.parse(body);

    // Check if deal exists and user has permission to edit
    const existingDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { ownerId: true, createdBy: true }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    // Validate foreign keys if provided
    await validateReferences({
      userId: validatedData.ownerId,
      customerId: validatedData.customerId,
      companyId: validatedData.companyId,
    });

    const deal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.value !== undefined && { value: validatedData.value }),
        ...(validatedData.probability !== undefined && { probability: validatedData.probability }),
        ...(validatedData.stage !== undefined && { stage: validatedData.stage }),
        ...(validatedData.source !== undefined && { source: validatedData.source }),
        ...(validatedData.customerId !== undefined && { customerId: validatedData.customerId }),
        ...(validatedData.companyId !== undefined && { companyId: validatedData.companyId }),
        ...(validatedData.ownerId !== undefined && { ownerId: validatedData.ownerId }),
        ...(validatedData.expectedCloseDate !== undefined && { 
          expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null 
        }),
        ...(validatedData.actualCloseDate !== undefined && { 
          actualCloseDate: validatedData.actualCloseDate ? new Date(validatedData.actualCloseDate) : null 
        }),
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        company: {
          select: { id: true, name: true, industry: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = rateLimiters.strict(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await requireAuth();
    const dealId = params.id;

    // Check if deal exists
    const existingDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      select: { id: true }
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }

    await prisma.deal.delete({
      where: { id: dealId },
    });

    return NextResponse.json({ message: "Deal deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
});
