"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { UseCheckoutPreviewResult } from "../hooks/useCheckoutPreview";

interface CheckoutPreviewContextValue {
  preview: UseCheckoutPreviewResult | null;
  setPreview: (preview: UseCheckoutPreviewResult) => void;
}

const CheckoutPreviewContext = createContext<CheckoutPreviewContextValue | null>(null);

// Default preview state for early renders before CheckoutForm initializes
const defaultPreview: UseCheckoutPreviewResult = {
  status: "idle",
  totals: null,
  message: null,
  rules: [],
  selectedRuleId: null,
  setSelectedRuleId: () => {},
  needsLocation: false,
  refresh: async () => {},
};

export function CheckoutPreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<UseCheckoutPreviewResult | null>(defaultPreview);

  return (
    <CheckoutPreviewContext.Provider value={{ preview, setPreview }}>
      {children}
    </CheckoutPreviewContext.Provider>
  );
}

export function useSharedCheckoutPreview(): UseCheckoutPreviewResult {
  const context = useContext(CheckoutPreviewContext);
  if (!context) {
    throw new Error("useSharedCheckoutPreview must be used within CheckoutPreviewProvider");
  }
  // Return default preview if not yet initialized instead of throwing
  return context.preview ?? defaultPreview;
}

export function useSetCheckoutPreview() {
  const context = useContext(CheckoutPreviewContext);
  if (!context) {
    throw new Error("useSetCheckoutPreview must be used within CheckoutPreviewProvider");
  }
  return context.setPreview;
}