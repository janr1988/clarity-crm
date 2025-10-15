import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

/**
 * Transaction helper for complex multi-step operations
 * Provides rollback safety and better error handling
 */

/**
 * Creates a customer placeholder for a deal if no customer exists
 * Used within transactions to ensure data consistency
 */
export async function createCustomerPlaceholder(
  tx: any,
  companyId: string,
  createdBy: string,
  customerName?: string
) {
  const existingCustomer = await tx.customer.findFirst({
    where: { companyId },
  });

  if (existingCustomer) {
    return existingCustomer.id;
  }

  const placeholder = await tx.customer.create({
    data: {
      name: customerName || "Deal Contact",
      email: undefined,
      status: "PROSPECT",
      createdBy,
      companyId,
    },
  });

  return placeholder.id;
}

/**
 * Creates a deal with all related entities in a single transaction
 * Handles customer placeholder creation if needed
 */
export async function createDealWithRelations(data: {
  name: string;
  description?: string;
  value: number;
  probability: number;
  stage: string;
  source?: string;
  customerId?: string;
  companyId?: string;
  ownerId: string;
  createdBy: string;
  expectedCloseDate?: Date;
}) {
  return await prisma.$transaction(async (tx) => {
    let resolvedCustomerId = data.customerId;

    // Create customer placeholder if needed
    if (!resolvedCustomerId && data.companyId) {
      resolvedCustomerId = await createCustomerPlaceholder(
        tx,
        data.companyId,
        data.createdBy
      );
    }

    // Create the deal
    return await tx.deal.create({
      data: {
        name: data.name,
        description: data.description,
        value: data.value,
        probability: data.probability,
        stage: data.stage,
        source: data.source,
        ...(resolvedCustomerId ? { customerId: resolvedCustomerId } : {}),
        ...(data.companyId ? { companyId: data.companyId } : {}),
        ownerId: data.ownerId,
        createdBy: data.createdBy,
        expectedCloseDate: data.expectedCloseDate,
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
}

/**
 * Updates a deal and creates activity log in a single transaction
 */
export async function updateDealWithActivity(
  dealId: string,
  updateData: any,
  activityData: {
    type: string;
    title: string;
    description?: string;
    userId: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // Update the deal
    const updatedDeal = await tx.deal.update({
      where: { id: dealId },
      data: updateData,
      include: {
        customer: true,
        company: true,
        owner: true,
      },
    });

    // Create activity log
    await tx.activity.create({
      data: {
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        userId: activityData.userId,
        dealId: dealId,
      },
    });

    return updatedDeal;
  });
}

/**
 * Deletes a deal and all related data in a single transaction
 * Ensures no orphaned records are left behind
 */
export async function deleteDealWithCleanup(dealId: string) {
  return await prisma.$transaction(async (tx) => {
    // Delete related activities first
    await tx.activity.deleteMany({
      where: { dealId },
    });

    // Delete deal notes
    await tx.dealNote.deleteMany({
      where: { dealId },
    });

    // Delete the deal
    const deletedDeal = await tx.deal.delete({
      where: { id: dealId },
    });

    return deletedDeal;
  });
}

/**
 * Reassigns a task and creates activity log in a single transaction
 */
export async function reassignTaskWithActivity(
  taskId: string,
  newAssigneeId: string,
  activityData: {
    type: string;
    title: string;
    description?: string;
    userId: string;
  }
) {
  return await prisma.$transaction(async (tx) => {
    // Update the task
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: { assigneeId: newAssigneeId },
      include: {
        assignee: true,
        createdBy: true,
        team: true,
      },
    });

    // Create activity log
    await tx.activity.create({
      data: {
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        userId: activityData.userId,
        taskId: taskId,
      },
    });

    return updatedTask;
  });
}

/**
 * Creates a customer with company association in a single transaction
 */
export async function createCustomerWithCompany(
  customerData: any,
  companyData?: any
) {
  return await prisma.$transaction(async (tx) => {
    let companyId = customerData.companyId;

    // Create company if provided and doesn't exist
    if (companyData && !companyId) {
      const company = await tx.company.create({
        data: companyData,
      });
      companyId = company.id;
    }

    // Create customer
    return await tx.customer.create({
      data: {
        ...customerData,
        companyId,
      },
      include: {
        companyRef: true,
        creator: true,
        assignee: true,
      },
    });
  });
}

/**
 * Generic transaction wrapper with error handling
 */
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>,
  errorMessage = "Transaction failed"
): Promise<T> {
  try {
    return await prisma.$transaction(operation);
  } catch (error) {
    throw new AppError(
      `${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
      "TRANSACTION_ERROR"
    );
  }
}
