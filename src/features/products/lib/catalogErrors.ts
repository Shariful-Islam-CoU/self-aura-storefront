import { ApiError } from "@/lib/api/client";

/**
 * Catalogue error mapping - turns any failure from `catalogService` into
 * customer-friendly copy for /shop and /categories/[slug].
 *
 * Mirrors `toReviewError` in the reviews feature: a single place where HTTP
 * status becomes plain language, so no raw backend message, status code or
 * stack trace can ever reach the customer. The catalogue pages are server
 * components, so they map the error inline and render an `ErrorState` rather
 * than letting it bubble to the route `error.tsx` (which cannot see the
 * status once Next.js has serialised the error across the RSC boundary).
 */

export interface CatalogErrorView {
  title: string;
  description: string;
}

/**
 * Wording per failure mode. `401`/`403` are treated as a genuine access
 * failure rather than an expected state: the catalogue reads the storefront
 * uses are public backend endpoints, so a rejection means the request never
 * reached the catalogue - the customer is told to try again instead of being
 * sent into a pointless sign-in loop.
 */
function viewFor(status: number, action: "load" | "search"): CatalogErrorView {
  if (status === 401 || status === 403) {
    return {
      title: "We couldn't reach the collection",
      description:
        "Something is blocking access to our catalogue right now. Please try again in a moment.",
    };
  }

  if (status === 400) {
    return {
      title: "We couldn't read that request",
      description:
        action === "search"
          ? "That search didn't look right. Try a shorter or different term."
          : "Those filters didn't look right. Try clearing one of them.",
    };
  }

  if (status === 404) {
    return {
      title: "We couldn't find that page",
      description: "The products you're looking for may have been moved or removed.",
    };
  }

  if (status === 429) {
    return {
      title: "Too many requests",
      description: "Please wait a moment before searching again.",
    };
  }

  if (status >= 500) {
    return {
      title: "We couldn't load the products",
      description:
        "Something went wrong on our side. Please try again in a moment — nothing is wrong with your search.",
    };
  }

  return {
    title: "We couldn't load the products",
    description: "Please check your connection and try again.",
  };
}

/**
 * Map a thrown error to friendly copy.
 *
 * A `TypeError`/`AbortError` is a transport failure (offline, DNS, timeout)
 * rather than an API response, so it gets connection wording.
 */
export function toCatalogErrorView(
  error: unknown,
  action: "load" | "search" = "load"
): CatalogErrorView {
  if (error instanceof ApiError) {
    return viewFor(error.status, action);
  }

  if (error instanceof Error && (error.name === "TypeError" || error.name === "AbortError")) {
    return {
      title: "You appear to be offline",
      description: "Check your internet connection and try again.",
    };
  }

  return {
    title: "We couldn't load the products",
    description: "Please try again in a moment.",
  };
}
