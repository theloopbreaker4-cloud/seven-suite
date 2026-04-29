/**
 * ⚠️ SHARED FILE - DO NOT MODIFY IN BACKEND OR FRONTEND
 *
 * Project: Seven
 * Source: shared/types/api.types.shared.ts
 * Used by: Backend (controllers), Frontend (services)
 *
 * Edit only in shared directory!
 * Changes here will affect both backend and frontend applications.
 *
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * Created: 2025-10-26
 */

/**
 * Generic API response wrapper
 * @template T - Type of the data payload
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response data */
  data: T;
  /** Optional message for the client */
  message?: string;
  /** Timestamp of the response */
  timestamp: number;
}

/**
 * API error response structure
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  statusCode: number;
  /** Optional error details */
  details?: any;
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * Paginated response structure
 * @template T - Type of items in the list
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Has next page */
  hasNext: boolean;
  /** Has previous page */
  hasPrevious: boolean;
}

/**
 * Utility type: makes specified properties optional
 */
export type Nullable<T> = T | null;

/**
 * Utility type: makes all properties optional and nullable
 */
export type Optional<T> = T | undefined;

/**
 * Utility type: makes specified keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type: makes specified keys required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
