import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { CheckoutPreviewProvider } from "@/features/checkout/components/CheckoutPreviewContext";
import type { UseCheckoutPreviewResult } from "@/features/checkout/hooks/useCheckoutPreview";

/**
 * Checkout delivery-option UI.
 *
 * The preview hook is mocked so these tests control the rules and status
 * directly; the backend preview remains the only source of pricing.
 */

const previewState = vi.hoisted(() => ({
  status: "idle",
  totals: null,
  message: null,
  rules: [],
  selectedRuleId: null,
  setSelectedRuleId: () => {},
  needsLocation: true,
  refresh: async () => {},
})) as UseCheckoutPreviewResult;

vi.mock("@/features/checkout/hooks/useCheckoutPreview", () => ({
  useCheckoutPreview: () => previewState,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/checkout",
}));

// Payment settings: keep the form offline and deterministic.
vi.mock("@/features/checkout/services/paymentSettingsService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/checkout/services/paymentSettingsService")>();
  return {
    ...actual,
    fetchPublicPaymentSettings: () => new Promise(() => {}),
  };
});

vi.mock("@/features/cart/hooks/useCart", () => ({
  useCart: () => ({
    items: [],
    subtotal: 0,
    hydrated: true,
    clearCart: () => {},
  }),
}));

function renderForm() {
  return render(
    <CheckoutPreviewProvider>
      <CheckoutForm />
    </CheckoutPreviewProvider>
  );
}

beforeEach(() => {
  previewState.rules = [];
  previewState.selectedRuleId = null;
  previewState.status = "idle";
  previewState.totals = null;
  previewState.message = null;
});

describe("Checkout delivery options", () => {
  it("lists every active rule with its price, marking free delivery", () => {
    previewState.rules = [
      { id: "r1", name: "Inside Dhaka", price: 80, estimatedMinDays: 1, estimatedMaxDays: 2 },
      { id: "r2", name: "Tomsom Bridge", price: 0, estimatedMinDays: 2, estimatedMaxDays: 3 },
    ];
    previewState.selectedRuleId = "r1";

    renderForm();

    expect(screen.getByRole("radiogroup", { name: "Delivery options" })).toBeTruthy();
    const dhaka = screen.getByRole("radio", { name: "Inside Dhaka" }) as HTMLInputElement;
    expect(dhaka.checked).toBe(true);
    expect(screen.getByText("FREE")).toBeTruthy();
    expect(screen.getAllByText((content) => content.includes("৳80")).length).toBeGreaterThan(0);
  });

  it("explains when no delivery options are available", () => {
    renderForm();
    expect(screen.getByText(/No delivery options available/)).toBeTruthy();
  });

  it("offers a retry when the delivery calculation fails", () => {
    previewState.status = "error";
    previewState.message = "We couldn't load the delivery options. Please try again.";

    renderForm();

    expect(screen.getAllByText(/couldn't load the delivery options/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
