import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createDealSchema = z.object({
  name: z.string().min(1),
  customerId: z.string(),
  companyId: z.string(),
  value: z.number().positive(),
  probability: z.number().min(0).max(100).default(50),
  stage: z.string().default("PROSPECTING"),
  expectedCloseDate: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const ownerId = searchParams.get("ownerId");

    // Sales Agent can only see their own deals
    const isAgent = session.user.role === "SALES_AGENT";
    const filterOwnerId = isAgent ? session.user.id : ownerId;

    const deals = await prisma.deal.findMany({
      where: {
        ...(stage && { stage }),
        ...(filterOwnerId && { ownerId: filterOwnerId }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true, industry: true } },
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { notes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deals);
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

    const deal = await prisma.deal.create({
      data: {
        ...validatedData,
        ownerId: validatedData.ownerId || session.user.id,
        createdBy: session.user.id,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
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

