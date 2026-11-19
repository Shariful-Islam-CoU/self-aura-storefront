import { siteConfig } from "@/lib/config/env";

/**
 * Minimal, reusable REST client for the Self Aura backend.
 *
 * The backend mounts its public API under `/api` (e.g. port 5000 -> base URL
 * `http://localhost:5000/api`). Call paths WITHOUT a leading `/api`, for
 * example `api.get<Product>("/products/abc")`.
 *
 * Services for products, categories, customers, orders, authentication and
 * cart/checkout will build on this client in later steps.
 */

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON body - serialized automatically. A FormData body is sent as-is. */
  body?: unknown;
  /**
   * Default abort timeout. The caller can still pass an `AbortSignal` in
   * `signal` for fine-grained control.
   */
  timeoutMs?: number;
}

export interface ApiErrorPayload {
  success: false;
  message?: string;
  errors?: unknown;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.apiUrl}${normalized}`;
}

function buildHeaders(headers: HeadersInit | undefined, hasBody: boolean): Headers {
  const result = new Headers(headers);
  if (!result.has("Accept")) result.set("Accept", "application/json");
  // Only declare a JSON body when there is one: a Content-Type on a GET turns
  // every cross-origin read into a CORS preflight for no reason.
  if (hasBody && !result.has("Content-Type")) result.set("Content-Type", "application/json");
  return result;
}

/** Aborts when ANY of the given signals aborts (caller signal + timeout). */
function anySignal(signals: AbortSignal[]): AbortSignal {
  if (signals.length === 1) return signals[0];
  if (typeof AbortSignal.any === "function") return AbortSignal.any(signals);
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15_000, body, signal, headers, ...rest } = options;

  // The timeout always applies, even when the caller passes its own signal.
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signals = signal ? [signal, timeoutController.signal] : [timeoutController.signal];

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...rest,
      // FormData sets its own multipart Content-Type (with boundary).
      headers: buildHeaders(headers, body !== undefined && !isFormData),
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: anySignal(signals),
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
/** True when the backend rejected the session (expired/invalid token). */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
