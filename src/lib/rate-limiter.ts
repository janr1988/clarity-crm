/**
 * Rate limiting utility for API routes
 * Provides protection against abuse and ensures fair usage
 */

import { NextRequest } from "next/server";
import { Errors } from "./errors";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0].trim() || realIP || request.ip || "unknown";
  return `rate_limit:${ip}`;
}

/**
 * Rate limiting middleware factory
 * 
 * @example
 * const rateLimit = createRateLimit({
 *   maxRequests: 100,
 *   windowMs: 60000, // 1 minute
 * });
 * 
 * export const POST = rateLimit(async (request: NextRequest) => {
 *   // Your API logic here
 * });
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minute
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
  } = config;

  return function rateLimit<T extends any[]>(
    handler: (...args: T) => Promise<Response>
  ) {
    return async (...args: T): Promise<Response> => {
      const request = args[0] as NextRequest;
      const key = keyGenerator(request);
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);
      
      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired one
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now,
        };
        rateLimitStore.set(key, entry);
      }
      
      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        
        return new Response(
          JSON.stringify({
            error: "Too many requests",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter,
            limit: maxRequests,
            remaining: 0,
            resetTime: entry.resetTime,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": entry.resetTime.toString(),
            },
          }
        );
      }
      
      // Increment counter
      entry.count++;
      
      try {
        // Execute the handler
        const response = await handler(...args);
        
        // Skip successful requests if configured
        if (skipSuccessfulRequests && response.status < 400) {
          entry.count--;
        }
        
        // Add rate limit headers to response
        const remaining = Math.max(0, maxRequests - entry.count);
        response.headers.set("X-RateLimit-Limit", maxRequests.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", entry.resetTime.toString());
        
        return response;
      } catch (error) {
        // Skip failed requests if configured
        if (skipFailedRequests) {
          entry.count--;
        }
        
        throw error;
      }
    };
  };
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimit({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (request) => {
      // Use IP + User-Agent for auth endpoints
      const ip = defaultKeyGenerator(request);
      const userAgent = request.headers.get("user-agent") || "unknown";
      return `auth:${ip}:${userAgent}`;
    },
  }),
  
  // Standard API rate limiting
  api: createRateLimit({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Strict rate limiting for sensitive operations
  strict: createRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Lenient rate limiting for read operations
  read: createRateLimit({
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Rate limiting for file uploads
  upload: createRateLimit({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Rate limiting for search operations
  search: createRateLimit({
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
  }),
};

/**
 * User-based rate limiting (requires authentication)
 * Limits requests per user rather than per IP
 */
export function createUserRateLimit(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return createRateLimit({
    ...config,
    keyGenerator: (request) => {
      // Extract user ID from request (you'll need to implement this)
      const userId = extractUserIdFromRequest(request);
      return `user_rate_limit:${userId}`;
    },
  });
}

/**
 * Extract user ID from request
 * This is a placeholder - implement based on your auth system
 */
function extractUserIdFromRequest(request: NextRequest): string {
  // This would typically extract from JWT token, session, etc.
  // For now, return a placeholder
  return "unknown_user";
}

/**
 * Rate limiting for specific operations
 */
export const operationRateLimits = {
  // Task creation
  createTask: createRateLimit({
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Deal creation
  createDeal: createRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Customer creation
  createCustomer: createRateLimit({
    maxRequests: 15,
    windowMs: 60 * 1000, // 1 minute
  }),
  
  // Bulk operations
  bulkOperation: createRateLimit({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  }),
};

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key: string): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} | null {
  const entry = rateLimitStore.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.resetTime) return null;
  
  return {
    count: entry.count,
    limit: 100, // Default limit
    remaining: Math.max(0, 100 - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for a specific key
 */
export function clearRateLimit(key: string): boolean {
  return rateLimitStore.delete(key);
}

/**
 * Get all rate limit entries (for debugging)
 */
export function getAllRateLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore);
}
