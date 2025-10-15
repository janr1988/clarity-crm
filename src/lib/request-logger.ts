/**
 * Request logging middleware for API routes
 * Provides consistent logging of API requests and responses
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

/**
 * Generates a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extracts client IP from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || "unknown";
}

/**
 * Wraps an API route handler with request/response logging
 * 
 * @example
 * export const GET = withRequestLogging(async (request: NextRequest) => {
 *   // Your API logic here
 *   return NextResponse.json({ data: "success" });
 * });
 */
export function withRequestLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const requestId = generateRequestId();
    const startTime = Date.now();
    const clientIP = getClientIP(request);
    
    // Extract request details
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    // Log request
    logger.apiRequest(method, url, {
      requestId,
      clientIP,
      userAgent,
    });

    try {
      // Execute the handler
      const response = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Log response
      logger.apiResponse(method, url, response.status, duration, {
        requestId,
        clientIP,
      });
      
      // Add request ID to response headers for debugging
      response.headers.set("X-Request-ID", requestId);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      logger.error(`API Handler Error: ${method} ${url}`, error as Error, {
        requestId,
        clientIP,
        duration,
      });
      
      // Re-throw the error to be handled by error middleware
      throw error;
    }
  };
}

/**
 * Performance monitoring wrapper
 * Logs slow operations for optimization
 */
export function withPerformanceLogging<T extends any[]>(
  operationName: string,
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;
      
      logger.performance(operationName, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Performance Error in ${operationName}`, error as Error, {
        duration,
      });
      
      throw error;
    }
  };
}

/**
 * Database operation logging helper
 */
export function logDatabaseOperation(
  operation: string,
  table: string,
  startTime: number,
  context?: any
) {
  const duration = Date.now() - startTime;
  
  logger.dbOperation(operation, table, duration, context);
}

/**
 * Business operation logging helper
 */
export function logBusinessOperation(
  operation: string,
  message: string,
  context?: any
) {
  logger.business(operation, message, context);
}

/**
 * Authentication logging helper
 */
export function logAuthEvent(
  event: string,
  userId?: string,
  context?: any
) {
  logger.auth(event, userId, context);
}
