/**
 * Generic API envelope shared by the Self Aura backend responses.
 *
 * Every backend endpoint responds with `{ success, message, data }` on
 * success and `{ success: false, message?, errors? }` on failure. Services
 * unwrap `data`; the REST client throws `ApiError` for non-2xx responses.
 */

/** Success envelope. */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
}

/** Error envelope returned by the backend on failed requests. */
export interface ApiErrorResponse {
  success: false;
  message?: string;
  errors?: unknown;
  [key: string]: unknown;
}

/** Pagination metadata returned alongside paged list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard paged payload: items plus pagination metadata. */
export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}