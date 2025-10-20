/**
 * SWR Configuration and Fetcher Utilities
 * Provides centralized caching and data fetching configuration
 */

export const swrConfig = {
  // Cache data for 60 seconds
  dedupingInterval: 60000,
  // Don't revalidate on focus for better perceived performance
  revalidateOnFocus: false,
  // Revalidate on mount if data is stale
  revalidateIfStale: true,
  // Retry on error with exponential backoff
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
};

/**
 * Default fetcher for SWR
 * Handles JSON responses and errors
 */
export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

/**
 * Fetcher with query params
 */
export async function fetcherWithParams<T = any>(
  url: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
  }
  
  const fullUrl = params ? `${url}?${searchParams.toString()}` : url;
  return fetcher<T>(fullUrl);
}

