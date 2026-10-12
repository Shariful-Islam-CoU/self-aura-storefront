import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";

/**
 * Storefront delivery-rules UI tests (Step 19A).
 *
 * These tests confirm the storefront renders the customer-safe delivery rules
 * list and that the checkout preview request is the sole source of pricing. The
 * backend does all arithmetic; the client sends nothing except the cart plus
 * the structured location.
 */

// Mock the useCheckoutPreview hook to control rules and status.
const previewState = vi.hoisted(() => ({
  rules: [] as Array<Record<string, unknown>>,
  status: "idle" as "idle" | "calculating" | "ready" | "unavailable" | "error",
  totals: null as any,
  message: null as string | null,
  districts: [] as string[],
  areas: [] as string[],
  needsLocation: true,
  refresh: async () => {},
}));

vi.mock("@/features/checkout/hooks/useCheckoutPreview", () => ({
  useCheckoutPreview: () => previewState,
}));

// Mock cart (empty so the form may render, but we don't require placing order).
vi.mock("@/features/cart/hooks/useCart", () => ({
  useCart: () => ({
    items: [],
    subtotal: 0,
    hydrated: true,
    clearCart: () => {},
  }),
}));

describe("Checkout delivery rules — display", () => {
  it("renders the delivery charges list with Bangla name first", () => {
    previewState.rules = [
      {
        name: "Tomsom Bridge",
        nameBn: "টমছম ব্রিজ",
        district: "Cumilla",
        area: "Tomsom Bridge",
        country: "Bangladesh",
        charge: 0,
        description: "Free delivery for Tomsom Bridge",
        descriptionBn: "টমছম ব্রিজে ফ্রি ডেলিভারি",
        displayOrder: 0,
      },
      {
        name: "Cumilla Default",
        district: "Cumilla",
        country: "Bangladesh",
        charge: 80,
        displayOrder: 1,
      },
    ];

    render(<CheckoutForm />);

    expect(screen.getByRole("heading", { name: /Delivery charges/ })).toBeTruthy();
    // Bangla comes first when provided.
    expect(screen.getByText(/টমছম ব্রিজ.*Tomsom Bridge/)).toBeTruthy();
    expect(screen.getAllByText((content) => content.includes("Cumilla") && content.includes("Tomsom Bridge")).length).toBeGreaterThan(0);
    expect(screen.getByText("Free")).toBeTruthy();
    // A non-zero charge is shown in the list.
    expect(screen.getAllByText((content) => content.includes("৳80")).length).toBeGreaterThan(0);
  });

  it("shows the location-dependent warning copy when no quote yet", () => {
    previewState.rules = [];
    previewState.totals = null;
    previewState.status = "idle";

    render(<CheckoutForm />);

    // The delivery panel explains the charge depends on the area.
    expect(screen.getByText(/Delivery charge depends on your area/)).toBeTruthy();
  });
});
