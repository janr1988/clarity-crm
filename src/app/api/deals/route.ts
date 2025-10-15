import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDealSchema } from "@/lib/validation";
import { requireAuth, validateReferences } from "@/lib/api-helpers";
import { handleApiError } from "@/lib/errors";
import { rateLimiters } from "@/lib/rate-limiter";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const ownerId = searchParams.get("ownerId");
    const filter = searchParams.get("filter");

    // Import date utilities
    const { getDateRange } = await import("@/lib/dateUtils");
    const { start, end } = getDateRange(filter as any);

    // Show all deals by default; optionally filter by ownerId if provided
    const filterOwnerId = ownerId;

    // Date filter for deals
    const dateFilter = {
      OR: [
        // For deals without actualCloseDate, use createdAt
        { actualCloseDate: null, createdAt: { gte: start, lte: end } },
        // For deals with actualCloseDate, use actualCloseDate
        { actualCloseDate: { gte: start, lte: end } }
      ]
    };

    const deals = await prisma.deal.findMany({
      where: {
        ...(stage && { stage }),
        ...(filterOwnerId && { ownerId: filterOwnerId }),
        ...dateFilter,
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true, industry: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const stats = {
      totalValue: deals.reduce((sum, d) => sum + d.value, 0),
      weightedValue: deals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
      dealCount: deals.length,
      wonDeals: deals.filter((d) => d.stage === "CLOSED_WON").length,
      lostDeals: deals.filter((d) => d.stage === "CLOSED_LOST").length,
      activeDeals: deals.filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST").length,
    };

    return NextResponse.json({ deals, stats });
  } catch (error) {
    return handleApiError(error);
  }
}

export const POST = rateLimiters.strict(async (request: NextRequest) => {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createDealSchema.parse(body);

    // Validate foreign keys if provided
    await validateReferences({
      userId: validatedData.ownerId || session.user.id,
      customerId: validatedData.customerId,
      companyId: validatedData.companyId,
    });

    const effectiveOwnerId = validatedData.ownerId || session.user.id;

    // Use transaction for multi-step operations
    const deal = await prisma.$transaction(async (tx) => {
      // If customerId is not provided, try to associate one from the company (or create a placeholder)
      let resolvedCustomerId: string | undefined = validatedData.customerId || undefined;
      
      if (!resolvedCustomerId && validatedData.companyId) {
        const existingCustomer = await tx.customer.findFirst({ 
          where: { companyId: validatedData.companyId } 
        });
        
        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
        } else {
          // Create placeholder customer within transaction
          const placeholder = await tx.customer.create({
            data: {
              name: "Deal Contact",
              email: undefined,
              status: "PROSPECT",
              createdBy: session.user.id,
              companyId: validatedData.companyId,
            },
          });
          resolvedCustomerId = placeholder.id;
        }
      }

      // Create deal within transaction
      return await tx.deal.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          value: validatedData.value,
          probability: validatedData.probability,
          stage: validatedData.stage,
          source: validatedData.source,
          ...(resolvedCustomerId ? { customerId: resolvedCustomerId } : {}),
          ...(validatedData.companyId ? { companyId: validatedData.companyId } : {}),
          ownerId: effectiveOwnerId,
          createdBy: session.user.id,
          expectedCloseDate: validatedData.expectedCloseDate
            ? new Date(validatedData.expectedCloseDate)
            : null,
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
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

