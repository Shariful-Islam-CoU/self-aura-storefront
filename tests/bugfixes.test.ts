import { describe, expect, it } from "vitest";
import { safeExternalUrl, safeRedirectPath, serializeJsonLd } from "@/lib/utils/url";
import { isValidBangladeshPhone, normalizeBangladeshPhone } from "@/features/checkout/lib/phone";
import { cartReducer, mergeCartItems } from "@/features/cart/context/cartReducer";
import type { CartReducerState } from "@/features/cart/context/cartReducer";
import type { CartItem } from "@/features/cart/types";
import { formatDate } from "@/lib/utils/format";

describe("safeRedirectPath", () => {
  it.each(["/", "/account", "/shop?category=rings&page=2", "/products/a-b#reviews"])(
    "keeps same-origin path %s",
    (path) => expect(safeRedirectPath(path)).toBe(path)
  );

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    " javascript:alert(1)",
    "data:text/html,hi",
    "account",
    "/foo\\bar",
    "/\tjavascript:alert(1)",
  ])("rejects %s", (value) => expect(safeRedirectPath(value)).toBe("/"));

  it("falls back for empty input", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("", "/shop")).toBe("/shop");
  });
});

describe("safeExternalUrl", () => {
  it("allows http(s) only", () => {
    expect(safeExternalUrl("https://track.example/123")).toBe("https://track.example/123");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });
});

describe("serializeJsonLd", () => {
  it("cannot close the surrounding <script> element", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    // Still valid JSON that round-trips to the original value.
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});

describe("Bangladesh phone validation", () => {
  it.each(["01712345678", "+8801712345678", "8801712345678", "017-1234 5678", "+880 1712-345678"])(
    "accepts %s",
    (value) => expect(isValidBangladeshPhone(value)).toBe(true)
  );

  it.each(["abc01712345678", "01234567890", "999999999999999", "0171234567", "017123456789", ""])(
    "rejects %s",
    (value) => expect(isValidBangladeshPhone(value)).toBe(false)
  );

  it("normalises to digits with an optional leading +", () => {
    expect(normalizeBangladeshPhone(" +880 1712-345 678 ")).toBe("+8801712345678");
    expect(normalizeBangladeshPhone("(017) 1234-5678")).toBe("01712345678");
  });
});

function line(id: string, quantity: number, stock: number, price = 100): CartItem {
  return {
    key: id,
    quantity,
    product: { id, slug: id, name: id, sellingPrice: price, stock, lowStock: false },
  };
}

describe("cart reducer", () => {
  const base: CartReducerState = { items: [], hydrated: true, storageKey: "k" };

  it("refreshes the product snapshot when merging into an existing line", () => {
    const first = cartReducer(base, { type: "add", item: line("p1", 2, 2, 100) });
    const merged = cartReducer(first, { type: "add", item: line("p1", 3, 10, 120) });
    expect(merged.items).toHaveLength(1);
    expect(merged.items[0].quantity).toBe(5);
    expect(merged.items[0].product.stock).toBe(10);
    expect(merged.items[0].product.sellingPrice).toBe(120);
  });

  it("merges a guest cart into the account cart, capped by stock", () => {
    const account = [line("p1", 1, 3), line("p2", 1, 5)];
    const guest = [line("p1", 5, 3), line("p3", 2, 4), line("gone", 1, 0)];
    const result = mergeCartItems(account, guest);
    expect(result.map((i) => [i.key, i.quantity])).toEqual([
      ["p1", 3],
      ["p2", 1],
      ["p3", 2],
    ]);
  });
});

describe("formatDate", () => {
  it("uses Bangladesh time so server and client agree", () => {
    // 20:00 UTC on 1 Jan is already 2 Jan in Dhaka (UTC+6).
    expect(formatDate("2026-01-01T20:00:00Z")).toBe("2 January 2026");
  });

  it("returns an empty string for invalid input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("nope")).toBe("");
  });
});
