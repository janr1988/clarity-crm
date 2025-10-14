import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createDealSchema } from "@/lib/validation";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDealSchema.parse(body);

    // Validate referenced entities exist to avoid FK violations (P2003)
    if (validatedData.companyId) {
      const company = await prisma.company.findUnique({ where: { id: validatedData.companyId } });
      if (!company) {
        return NextResponse.json(
          { error: "Validation failed", details: [{ field: "companyId", message: "Selected company does not exist" }] },
          { status: 400 }
        );
      }
    }

    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: validatedData.customerId } });
      if (!customer) {
        return NextResponse.json(
          { error: "Validation failed", details: [{ field: "customerId", message: "Selected customer does not exist" }] },
          { status: 400 }
        );
      }
    }

    const effectiveOwnerId = validatedData.ownerId || session.user.id;
    const owner = await prisma.user.findUnique({ where: { id: effectiveOwnerId } });
    if (!owner) {
      return NextResponse.json(
        { error: "Validation failed", details: [{ field: "ownerId", message: "Selected owner does not exist" }] },
        { status: 400 }
      );
    }

    // Ensure creator exists; if not, fall back to ownerId to keep UX flowing
    const creator = await prisma.user.findUnique({ where: { id: session.user.id } });
    const creatorId = creator ? session.user.id : effectiveOwnerId;

    // Dev diagnostics
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DealCreate] validated', {
        name: validatedData.name,
        value: validatedData.value,
        probability: validatedData.probability,
        stage: validatedData.stage,
        customerId: validatedData.customerId || null,
        companyId: validatedData.companyId || null,
        ownerId: effectiveOwnerId,
        createdBy: creatorId,
        expectedCloseDate: validatedData.expectedCloseDate || null,
      });
    }

    // If customerId is not provided, try to associate one from the company (or create a lightweight placeholder)
    let resolvedCustomerId: string | undefined = validatedData.customerId || undefined;
    if (!resolvedCustomerId && validatedData.companyId) {
      const existingCustomer = await prisma.customer.findFirst({ where: { companyId: validatedData.companyId } });
      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      } else {
        const placeholder = await prisma.customer.create({
          data: {
            name: "Deal Contact",
            email: undefined,
            status: "PROSPECT",
            createdBy: creatorId,
            companyId: validatedData.companyId,
          },
        });
        resolvedCustomerId = placeholder.id;
      }
    }

    const deal = await prisma.deal.create({
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
        createdBy: creatorId,
        expectedCloseDate: validatedData.expectedCloseDate
          ? new Date(validatedData.expectedCloseDate)
          : null,
      },
      include: {
        customer: true,
        company: true,
        owner: true,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors.map(err => ({
            field: err.path ? err.path.join('.') : 'unknown',
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    // Map common Prisma errors to clearer client messages
    const anyErr = error as any;
    if (anyErr?.code === 'P2003') {
      // Try to indicate which relation likely failed
      const suspects: string[] = [];
      try {
        const parsed = await request.clone().json();
        if (parsed?.customerId) {
          const exists = await prisma.customer.findUnique({ where: { id: parsed.customerId } });
          if (!exists) suspects.push('customerId');
        }
        if (parsed?.companyId) {
          const exists = await prisma.company.findUnique({ where: { id: parsed.companyId } });
          if (!exists) suspects.push('companyId');
        }
        const effOwner = parsed?.ownerId || (await getServerSession(authOptions))?.user.id;
        if (effOwner) {
          const exists = await prisma.user.findUnique({ where: { id: effOwner } });
          if (!exists) suspects.push('ownerId');
        }
        const creatorExists = await prisma.user.findUnique({ where: { id: (await getServerSession(authOptions))!.user.id } });
        if (!creatorExists) suspects.push('createdBy');
      } catch {}
      return NextResponse.json(
        { error: "Foreign key constraint failed. Check selections.", details: suspects.length ? suspects : undefined },
        { status: 400 }
      );
    }
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}

