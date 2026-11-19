/**
 * Messenger deep-link helpers for the "Ask about this Product" CTA.
 *
 * Meta forwards the `text` parameter through the m.me redirect chain, but the
 * Messenger web client does not always prefill the composer (notably right
 * after a login redirect). The caller therefore also copies the same message
 * to the clipboard, so the customer can paste it when prefill is dropped.
 */
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types";

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Extract `page-name` from an m.me / facebook.com URL. */
function extractPageName(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "m.me") return u.pathname.replace(/^\//, "");
    if (u.hostname === "facebook.com" || u.hostname === "www.facebook.com" || u.hostname === "m.facebook.com") {
      // facebook.com/profile.php?id=123 -> the numeric id is the m.me handle.
      if (u.pathname.replace(/\/+$/, "") === "/profile.php") {
        const id = u.searchParams.get("id");
        return id && /^\d+$/.test(id) ? id : null;
      }
      const segments = u.pathname.split("/").filter(Boolean);
      // facebook.com/pages/Some-Name/123 -> the trailing numeric page id.
      if (segments[0] === "pages") {
        const last = segments[segments.length - 1];
        return last && /^\d+$/.test(last) ? last : null;
      }
      // facebook.com/PageName -> "PageName" (ignore any trailing path).
      return segments[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The message the customer sends to the store.
 *
 * Deliberately a SINGLE line: Messenger's prefill handling is more reliable
 * with one line than with `%0A` newlines. Includes the short product details
 * (name, SKU, price) and the canonical product URL.
 */
export function buildProductMessage(product: Product, siteUrl: string): string {
  const url = `${siteUrl}/products/${product.slug}`;
  const sku = product.sku ? ` (SKU: ${product.sku})` : "";
  return `Hi! I'd like to ask about "${product.name}"${sku} — ${formatPrice(product.sellingPrice)}. ${url}`;
}

/**
 * Build the Messenger URL.
 *
 * @returns the m.me link with the prefilled message, or `null` when the
 *          configured Messenger URL is missing/invalid (CTA stays hidden).
 */
export function buildProductMessengerHref(
  messengerUrl: string,
  product: Product,
  siteUrl: string
): string | null {
  if (!messengerUrl || !isValidHttpsUrl(messengerUrl)) {
    return null;
  }

  const message = buildProductMessage(product, siteUrl);
  const pageName = extractPageName(messengerUrl);

  // Unknown but valid HTTPS link (e.g. messenger.com/t/...): keep it as the
  // destination and append the text parameter.
  if (!pageName) {
    try {
      const u = new URL(messengerUrl);
      u.searchParams.set("text", message);
      return u.toString().replace(/\+/g, "%20");
    } catch {
      return null;
    }
  }

  const target = new URL(`https://m.me/${pageName}`);
  target.searchParams.set("text", message);
  // URLSearchParams encodes spaces as "+"; Meta's examples use %20 and some
  // intermediaries only decode the percent form.
  return target.toString().replace(/\+/g, "%20");
}
