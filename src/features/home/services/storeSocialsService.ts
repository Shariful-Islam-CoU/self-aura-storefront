/**
 * Public store-social-links service - the storefront's only source of the
 * brand's social channel URLs.
 *
 * The URLs are managed in the Management App (application settings keys
 * `social.facebook`, `social.instagram`, `social.messenger`) and read from
 * the backend's public endpoint `GET /api/public/store-socials`. They are
 * NEVER hardcoded in the storefront: an unset channel returns an empty
 * string and must not be rendered as a link.
 *
 * Response shape (public.routes.ts -> applicationSettingsService.getPublicSocials):
 *
 *   { facebook: string, instagram: string, messenger: string }
 */
import { api } from "@/lib/api/client";
import type { ApiResponse } from "@/types";

export interface StoreSocials {
  facebook: string;
  instagram: string;
  messenger: string;
}

/** Safe fallback: every channel unset, so no icon renders as a link. */
export const EMPTY_STORE_SOCIALS: StoreSocials = {
  facebook: "",
  instagram: "",
  messenger: "",
};

/** Runtime guard - never trust a malformed payload. */
function isStoreSocials(value: unknown): value is StoreSocials {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.facebook === "string" &&
    typeof record.instagram === "string" &&
    typeof record.messenger === "string"
  );
}

/** True when at least one channel has a URL to link to. */
export function hasAnySocial(socials: StoreSocials): boolean {
  return Boolean(socials.facebook || socials.instagram || socials.messenger);
}

/**
 * Fetch the customer-safe social links from the backend.
 * Throws on failure or on an unexpected payload shape - the caller decides
 * how to degrade (sections hide themselves when there is nothing to link).
 */
export async function fetchStoreSocials(): Promise<StoreSocials> {
  const envelope = await api.get<ApiResponse<StoreSocials> | null>(
    "/public/store-socials"
  );
  const socials = envelope?.data;
  if (!isStoreSocials(socials)) {
    throw new Error("Unexpected store social links response from the backend.");
  }
  return socials;
}

let cachedPromise: Promise<StoreSocials> | null = null;

/**
 * Cached variant for client components (footer, newsletter row): concurrent
 * mounts share one in-flight request, and a failed request clears the cache
 * entry so a later retry can succeed.
 */
export function fetchStoreSocialsCached(): Promise<StoreSocials> {
  if (!cachedPromise) {
    cachedPromise = fetchStoreSocials().catch((error: unknown) => {
      cachedPromise = null;
      throw error;
    });
  }
  return cachedPromise;
}
