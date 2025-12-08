/**
 * Pagination utilities for Firebase Firestore queries
 * Provides cursor-based pagination and lazy loading support
 */

export interface PaginationOptions {
  limit?: number;
  startAfter?: any;
  startAt?: any;
}

export interface PaginationResult<T> {
  data: T[];
  hasMore: boolean;
  cursor?: any;
  total?: number;
}

/**
 * Default page size for Firestore queries
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Get pagination constraints for Firestore queries
 */
export function getPaginationConstraints(options: PaginationOptions) {
  const limit = options.limit || DEFAULT_PAGE_SIZE;
  const constraints: any[] = [];

  if (options.startAfter) {
    constraints.push(options.startAfter);
  } else if (options.startAt) {
    constraints.push(options.startAt);
  }

  return { limit, constraints };
}

/**
 * Process query results with pagination metadata
 */
export function processPaginatedResults<T>(
  items: T[],
  limit: number
): PaginationResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const cursor = hasMore ? items[limit - 1] : undefined;

  return {
    data,
    hasMore,
    cursor,
  };
}

/**
 * Helper to combine pagination results
 */
export function mergePaginationResults<T>(
  ...results: PaginationResult<T>[]
): PaginationResult<T> {
  const allData = results.flatMap(r => r.data);
  const hasMore = results.some(r => r.hasMore);
  const cursor = results[results.length - 1]?.cursor;

  return {
    data: allData,
    hasMore,
    cursor,
  };
}
