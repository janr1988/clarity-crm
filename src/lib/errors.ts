import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Custom application error class
 * Use this for throwing expected errors with specific status codes
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Centralized error handler for API routes
 * Converts various error types into consistent API responses
 * 
 * @example
 * try {
 *   // ... your code
 * } catch (error) {
 *   return handleApiError(error);
 * }
 */
export function handleApiError(error: unknown): NextResponse {
  // Log the error for debugging
  console.error("API Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.errors.map((err) => ({
          field: err.path.join(".") || "unknown",
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        return NextResponse.json(
          {
            error: "A record with this value already exists",
            code: "DUPLICATE_RECORD",
            details: {
              field: target?.[0] || "unknown",
            },
          },
          { status: 409 }
        );

      case "P2003":
        // Foreign key constraint violation
        return NextResponse.json(
          {
            error: "Referenced record does not exist",
            code: "FOREIGN_KEY_CONSTRAINT",
            details: {
              field: error.meta?.field_name || "unknown",
            },
          },
          { status: 400 }
        );

      case "P2025":
        // Record not found
        return NextResponse.json(
          {
            error: "Record not found",
            code: "NOT_FOUND",
          },
          { status: 404 }
        );

      case "P2014":
        // Required relation violation
        return NextResponse.json(
          {
            error: "The change would violate a required relation",
            code: "RELATION_VIOLATION",
          },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          {
            error: "Database operation failed",
            code: "DATABASE_ERROR",
            details: process.env.NODE_ENV === "development" 
              ? { prismaCode: error.code }
              : undefined,
          },
          { status: 500 }
        );
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: "Invalid data provided to database",
        code: "DATABASE_VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || "APPLICATION_ERROR",
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Unknown errors
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === "production" 
        ? "An unexpected error occurred" 
        : message,
      code: "INTERNAL_ERROR",
      details: process.env.NODE_ENV === "development" && error instanceof Error
        ? { stack: error.stack }
        : undefined,
    },
    { status: 500 }
  );
}

/**
 * Common error factory functions
 */
export const Errors = {
  unauthorized: () => new AppError("Unauthorized", 401, "UNAUTHORIZED"),
  
  forbidden: (message = "Forbidden") => 
    new AppError(message, 403, "FORBIDDEN"),
  
  notFound: (resource = "Resource") => 
    new AppError(`${resource} not found`, 404, "NOT_FOUND"),
  
  badRequest: (message: string, details?: any) => 
    new AppError(message, 400, "BAD_REQUEST", details),
  
  conflict: (message: string) => 
    new AppError(message, 409, "CONFLICT"),
  
  tooManyRequests: () => 
    new AppError("Too many requests", 429, "RATE_LIMIT_EXCEEDED"),
};

