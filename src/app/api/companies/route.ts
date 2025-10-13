import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCompanySchema } from "@/lib/validation";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
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
    const validatedData = createCompanySchema.parse(body);

    const company = await prisma.company.create({
      data: {
        ...validatedData,
        createdBy: session.user.id, // Set the creator to the logged-in user
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
