"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Copy,
  MapPin,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/Separator";
import { Select } from "@/components/ui/Select";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/features/cart/hooks/useCart";
import {
  CHECKOUT_PAYMENT_DESCRIPTIONS,
  CHECKOUT_PAYMENT_LABELS,
  CHECKOUT_PAYMENT_METHODS,
  isManualPaymentMethod,
} from "../types";
import {
  FALLBACK_PUBLIC_PAYMENT_SETTINGS,
  fetchPublicPaymentSettings,
} from "../services/paymentSettingsService";
import type { PublicPaymentSettings } from "../services/paymentSettingsService";
import type {
  CheckoutAddressForm,
  CheckoutCustomerForm,
  CheckoutField,
  CheckoutFieldErrors,
  CheckoutFormValues,
  CheckoutOrderError,
  CheckoutPaymentMethod,
  ManualPaymentInfo,
} from "../types";
import { validateCheckoutField, validateCheckoutForm } from "../lib/validation";
import {
  useCheckoutPreview,
  type UseCheckoutPreviewResult,
} from "../hooks/useCheckoutPreview";
import { DeliveryRulesList } from "./DeliveryRulesList";
import { useSetCheckoutPreview } from "./CheckoutPreviewContext";
import {
  buildCreateOrderRequest,
  createOrder,
  saveOrderHandoff,
  toCheckoutOrderError,
} from "../services/checkoutService";

const FIELD_IDS: Record<CheckoutField, string> = {
  fullName: "checkout-full-name",
  phone: "checkout-phone",
  facebookName: "checkout-facebook-name",
  facebookProfileUrl: "checkout-facebook-url",
  addressLine: "checkout-address-line",
  area: "checkout-area",
  district: "checkout-district",
  city: "checkout-city",
  postalCode: "checkout-postal-code",
  country: "checkout-country",
  deliveryNote: "checkout-delivery-note",
  transactionId: "checkout-transaction-id",
  senderPhone: "checkout-sender-phone",
};

function createInitialValues(): CheckoutFormValues {
  return {
    customer: { fullName: "", phone: "", facebookName: "", facebookProfileUrl: "" },
    address: {
      addressLine: "",
      area: "",
      district: "",
      city: "",
      postalCode: "",
      country: "Bangladesh",
      deliveryNote: "",
    },
    deliveryMethod: "standard",
    paymentMethod: "cod",
    manualPayment: { transactionId: "", senderPhone: "" },
  };
}

/**
 * Customer checkout form: contact details, delivery address, delivery &
 * payment method (Cash on Delivery or manual bKash/Nagad), order review and
 * Place Order.
 *
 * Overview of this payment flow:
 *  - COD needs no transaction id; payment stays unpaid until Self Aura
 *    receives payment.
 *  - bKash/Nagad are MANUAL: we show Self Aura's payment number (fetched from
 *    the backend public payment-settings endpoint - never hardcoded), the
 *    customer sends the exact amount, enters their transaction id (a claim,
 *    NOT verification), and the order carries that claim for Self Aura to
 *    verify later. The storefront never marks a payment verified.
 *  - Switching methods clears any previously captured transaction info.
 *  - Payment methods are offered per the backend configuration: disabled
 *    channels are simply not shown.
 *
 * Only the fields the backend Order API needs are collected. The form keeps
 * its values intact on failure, never auto-submits, and only clears the cart
 * after the backend confirms order creation. Order creation itself is
 * currently gated by the backend (management auth + required `customer`
 * ObjectId), which maps to a friendly "checkout isn't available yet" state -
 * the storefront never fabricates a customer id.
 */
export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, hydrated, clearCart } = useCart();

  const [values, setValues] = useState<CheckoutFormValues>(createInitialValues);
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<CheckoutOrderError | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    import("@/services/customerAuthService").then(({ customerAuthService }) => {
      customerAuthService
        .getMe(token)
        .then((res) => {
          const customer = res.customer as typeof res.customer & {
            defaultAddress?: Partial<CheckoutAddressForm>;
          };
          const saved = customer.defaultAddress;
          setValues((v) => ({
            ...v,
            customer: {
              fullName: customer.name || "",
              phone: customer.phone || "",
              facebookName: customer.facebookName || "",
              facebookProfileUrl: customer.facebookProfileUrl || "",
            },
            // Prefill the delivery address from the customer's saved address, if
            // any. Each field is only filled while still empty, so this can
            // never clobber something the customer has already typed.
            address: {
              ...v.address,
              addressLine: v.address.addressLine || saved?.addressLine || "",
              area: v.address.area || saved?.area || "",
              district: v.address.district || saved?.district || "",
              city: v.address.city || saved?.city || "",
              postalCode: v.address.postalCode || saved?.postalCode || "",
              country: saved?.country || v.address.country,
            },
          }));
        })
        .catch(() => {});
    });
  }, []);

  /**
   * Authoritative pricing from the backend.
   *
   * `preview.status` gates submission: the order button stays disabled until a
   * quote exists, so a customer can never submit an order for which delivery is
   * unknown, still loading, or unresolved for their location. The backend
   * re-runs the identical calculation when the order is created, so these
   * numbers are a review aid rather than the source of truth.
   */
  const preview = useCheckoutPreview({
    items: useMemo(
      () => items.map((item) => ({ product: item.product.id, quantity: item.quantity })),
      [items]
    ),
    location: useMemo(
      () => ({
        district: values.address.district,
        area: values.address.area,
        city: values.address.city,
        postalCode: values.address.postalCode,
      }),
      [values.address.district, values.address.area, values.address.city, values.address.postalCode]
    ),
    couponCode: values.coupon?.code,
    enabled: hydrated,
  });

  /** True only when the backend has produced a usable quote. */
  const canPlaceOrder = preview.status === "ready" && preview.totals !== null;

  // Share preview with CheckoutSummary via context - use stable reference
  const setSharedPreview = useSetCheckoutPreview();
  const sharedPreview = useMemo(() => ({
    status: preview.status,
    totals: preview.totals,
    message: preview.message,
    rules: preview.rules,
    selectedRuleId: preview.selectedRuleId,
    setSelectedRuleId: preview.setSelectedRuleId,
    needsLocation: preview.needsLocation,
    refresh: preview.refresh,
  }), [
    preview.status,
    preview.totals,
    preview.message,
    preview.rules,
    preview.selectedRuleId,
    preview.setSelectedRuleId,
    preview.needsLocation,
    preview.refresh,
  ]);

  useEffect(() => {
    setSharedPreview(sharedPreview);
  }, [sharedPreview, setSharedPreview]);

  // Merchant payment configuration comes from the backend's public
  // payment-settings endpoint - never hardcoded. While it loads (or if it
  // fails) only COD is offered (it needs no merchant number); manual methods
  // appear once their instruction numbers are known.
  const [paymentSettings, setPaymentSettings] = useState<PublicPaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [settingsRetryKey, setSettingsRetryKey] = useState(0);
  const paymentMethodRef = useRef<CheckoutPaymentMethod>("cod");

  // Mirror the selected method so the async settings load can reset it
  // without capturing a stale render's value.
  useEffect(() => {
    paymentMethodRef.current = values.paymentMethod;
  }, [values.paymentMethod]);

  const retryPaymentSettings = () => {
    setSettingsLoading(true);
    setSettingsError(false);
    setSettingsRetryKey((key) => key + 1);
  };

  useEffect(() => {
    let active = true;
    fetchPublicPaymentSettings()
      .then((settings) => {
        if (!active) return;
        setPaymentSettings(settings);
        // A freshly-fetched configuration may disable the currently selected
        // method - drop back to COD and clear any captured transaction data
        // rather than leaving a stale selection on the form.
        const selected = paymentMethodRef.current;
        const enabled =
          selected === "cod"
            ? settings.cod.enabled
            : selected === "bkash"
              ? settings.bkash.enabled
              : settings.nagad.enabled;
        if (!enabled) {
          setValues((v) => ({
            ...v,
            paymentMethod: "cod",
            manualPayment: { transactionId: "", senderPhone: "" },
          }));
          setErrors((e) => ({ ...e, transactionId: undefined, senderPhone: undefined }));
        }
      })
      .catch(() => {
        // Keep the last known-good settings if any; otherwise the fallback
        // (COD only) applies. The notice below offers a retry.
        if (active) setSettingsError(true);
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [settingsRetryKey]);

  const settings: PublicPaymentSettings = paymentSettings ?? FALLBACK_PUBLIC_PAYMENT_SETTINGS;

  /** Methods currently offered, per the backend configuration. */
  const availableMethods = useMemo(
    () =>
      CHECKOUT_PAYMENT_METHODS.filter((method) => {
        if (method === "cod") return settings.cod.enabled;
        if (method === "bkash") return settings.bkash.enabled;
        return settings.nagad.enabled;
      }),
    [settings]
  );

  function updateCustomer(field: keyof CheckoutCustomerForm, value: string) {
    setValues((v) => ({ ...v, customer: { ...v.customer, [field]: value } }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  function updateAddress(field: keyof CheckoutAddressForm, value: string) {
    setValues((v) => ({ ...v, address: { ...v.address, [field]: value } }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  function handleBlur(field: CheckoutField) {
    const error = validateCheckoutField(values, field);
    setErrors((e) => ({ ...e, [field]: error }));
  }

  /**
   * Selecting a payment method clears any transaction data captured under a
   * DIFFERENT method: a bKash transaction id can never leak onto a COD order
   * or into another wallet. Selecting the already-active option is a no-op.
   */
  function selectPaymentMethod(method: CheckoutPaymentMethod) {
    setValues((v) => ({
      ...v,
      paymentMethod: method,
      manualPayment:
        method === v.paymentMethod ? v.manualPayment : { transactionId: "", senderPhone: "" },
    }));
    setErrors((e) => ({ ...e, transactionId: undefined, senderPhone: undefined }));
  }

  function updateManualPayment(field: keyof ManualPaymentInfo, value: string) {
    setValues((v) => ({ ...v, manualPayment: { ...v.manualPayment, [field]: value } }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Duplicate-submission guard: the button is also disabled while pending,
    // but the ref covers programmatic/rapid double submits too.
    if (submittingRef.current) return;
    // No payment method is configured as available right now.
    if (availableMethods.length === 0) return;

    const validation = validateCheckoutForm(values);
    setErrors(validation.errors);
    if (!validation.valid) {
      const first = Object.keys(validation.errors)[0] as CheckoutField | undefined;
      if (first) {
        document.getElementById(FIELD_IDS[first])?.focus();
      }
      return;
    }

    // Delivery must be resolved by the backend before an order can be placed.
    // Re-running the preview here (rather than trusting the last render's
    // result) also catches a cart that changed after the quote was fetched.
    if (!canPlaceOrder) {
      await preview.refresh();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const request = buildCreateOrderRequest(values, items, preview.selectedRuleId ?? undefined);
      const token = localStorage.getItem("customer_token") ?? undefined;
      const order = await createOrder(request, token);

      // The backend has confirmed the order (real order number) - only now do
      // we capture the line thumbnails, clear the purchased cart and go to the
      // success page. On failure the cart stays intact.
      saveOrderHandoff({
        order,
        lineImages: items.map((item) => item.product.image?.url ?? ""),
        checkoutPaymentMethod: values.paymentMethod,
      });
      clearCart();
      router.replace(`/order-success/${order.orderNumber}`);
    } catch (error) {
      setSubmitError(toCheckoutOrderError(error));
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  const manualMethod = isManualPaymentMethod(values.paymentMethod);
  const placeOrderHint = manualMethod
    ? `${CHECKOUT_PAYMENT_LABELS[values.paymentMethod]} — your payment claim is submitted with your order and verified by Self Aura afterwards.`
    : "Cash on Delivery — you pay when your order arrives.";

  return (
    <form noValidate onSubmit={handleSubmit} aria-busy={submitting} className="space-y-6">
      {/* 1 - Customer information */}
      <CheckoutSection
        step={1}
        title="Customer information"
        description="We'll use these details for delivery and to confirm your order."
        icon={<User className="h-4 w-4" />}
      >
        <Input
          id={FIELD_IDS.fullName}
          label="Full name"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          required
          value={values.customer.fullName}
          error={errors.fullName}
          onChange={(event) => updateCustomer("fullName", event.target.value)}
          onBlur={() => handleBlur("fullName")}
        />
        <Input
          id={FIELD_IDS.phone}
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          helperText="e.g. 01XXXXXXXXX or +8801XXXXXXXXX"
          required
          value={values.customer.phone}
          error={errors.phone}
          onChange={(event) => updateCustomer("phone", event.target.value)}
          onBlur={() => handleBlur("phone")}
        />
        <Input
          id={FIELD_IDS.facebookName}
          label="Facebook Name (Optional)"
          name="facebookName"
          type="text"
          placeholder="Customer's Facebook name"
          value={values.customer.facebookName || ""}
          error={errors.facebookName}
          onChange={(event) => updateCustomer("facebookName", event.target.value)}
          onBlur={() => handleBlur("facebookName" as CheckoutField)}
        />
        <Input
          id={FIELD_IDS.facebookProfileUrl}
          label="Facebook Profile URL (Optional)"
          name="facebookProfileUrl"
          type="url"
          placeholder="https://facebook.com/..."
          value={values.customer.facebookProfileUrl || ""}
          error={errors.facebookProfileUrl}
          onChange={(event) => updateCustomer("facebookProfileUrl", event.target.value)}
          onBlur={() => handleBlur("facebookProfileUrl" as CheckoutField)}
        />
      </CheckoutSection>

      {/* 2 - Delivery address */}
      <CheckoutSection
        step={2}
        title="Delivery address"
        description="Where should we send your order?"
        icon={<MapPin className="h-4 w-4" />}
      >
        <Textarea
          id={FIELD_IDS.addressLine}
          label="Address"
          name="addressLine"
          autoComplete="street-address"
          placeholder="House, road, building, village/town"
          required
          rows={3}
          value={values.address.addressLine}
          error={errors.addressLine}
          onChange={(event) => updateAddress("addressLine", event.target.value)}
          onBlur={() => handleBlur("addressLine")}
        />
        {/*
          District and area are part of the shipping address. The customer also
          selects a delivery option in the Delivery step. Both are required.
        */}
        <Input
          id={FIELD_IDS.district}
          label="District"
          name="district"
          autoComplete="address-level1"
          placeholder="District, e.g. Dhaka"
          required
          value={values.address.district}
          error={errors.district}
          onChange={(event) => updateAddress("district", event.target.value)}
          onBlur={() => handleBlur("district")}
        />
        <Input
          id={FIELD_IDS.area}
          label="Area / Thana"
          name="area"
          autoComplete="address-level2"
          placeholder="Area, thana, e.g. Uttara"
          required
          value={values.address.area}
          error={errors.area}
          onChange={(event) => updateAddress("area", event.target.value)}
          onBlur={() => handleBlur("area")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id={FIELD_IDS.city}
            label="City"
            name="city"
            autoComplete="address-level2"
            placeholder="City (optional)"
            value={values.address.city}
            error={errors.city}
            onChange={(event) => updateAddress("city", event.target.value)}
            onBlur={() => handleBlur("city")}
          />
          <Input
            id={FIELD_IDS.postalCode}
            label="Postal code"
            name="postalCode"
            autoComplete="postal-code"
            placeholder="Optional"
            value={values.address.postalCode}
            error={errors.postalCode}
            onChange={(event) => updateAddress("postalCode", event.target.value)}
            onBlur={() => handleBlur("postalCode")}
          />
        </div>
        <Input
          id={FIELD_IDS.country}
          label="Country"
          name="country"
          autoComplete="country-name"
          value={values.address.country}
          error={errors.country}
          onChange={(event) => updateAddress("country", event.target.value)}
          onBlur={() => handleBlur("country")}
        />
        <Textarea
          id={FIELD_IDS.deliveryNote}
          label="Delivery instructions"
          name="deliveryNote"
          placeholder="e.g. call before delivery, leave with the gatehouse (optional)"
          rows={2}
          value={values.address.deliveryNote}
          error={errors.deliveryNote}
          onChange={(event) => updateAddress("deliveryNote", event.target.value)}
          onBlur={() => handleBlur("deliveryNote")}
        />
      </CheckoutSection>

      {/* 3 - Delivery */}
      <CheckoutSection
        step={3}
        title="Delivery"
        description="Choose your delivery option."
        icon={<Truck className="h-4 w-4" />}
      >
        <DeliveryRulesList
          rules={preview.rules}
          selectedRuleId={preview.selectedRuleId}
          onSelectRule={preview.setSelectedRuleId}
          className="mb-4"
        />
        <DeliveryQuotePanel preview={preview} />
      </CheckoutSection>

      {/* 4 - Payment method */}
      <CheckoutSection
        step={4}
        title="Payment method"
        description="Choose how you'd like to pay."
        icon={<Wallet className="h-4 w-4" />}
      >
        <div role="radiogroup" aria-label="Payment method" className="space-y-3">
          {availableMethods.map((method) => (
            <ChoiceOption
              key={method}
              name="paymentMethod"
              value={method}
              checked={values.paymentMethod === method}
              onChange={() => selectPaymentMethod(method)}
              title={CHECKOUT_PAYMENT_LABELS[method]}
              description={CHECKOUT_PAYMENT_DESCRIPTIONS[method]}
            />
          ))}
        </div>

        {settingsLoading && (
          <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Loading payment options…
          </p>
        )}

        {!settingsLoading && settingsError && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3"
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              We couldn&rsquo;t load the full payment options. Cash on Delivery is available — bKash
              and Nagad will reappear once payment settings load.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={retryPaymentSettings}
            >
              Retry
            </Button>
          </div>
        )}

        {!settingsLoading && availableMethods.length === 0 && (
          <p
            role="status"
            className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
          >
            No payment methods are currently available. Please try again later.
          </p>
        )}

        {isManualPaymentMethod(values.paymentMethod) && (
          <ManualPaymentPanel
            method={values.paymentMethod}
            subtotal={subtotal}
            loading={settingsLoading}
            paymentNumber={
              values.paymentMethod === "bkash" ? settings.bkash.number : settings.nagad.number
            }
            transactionId={values.manualPayment.transactionId}
            senderPhone={values.manualPayment.senderPhone}
            transactionIdError={errors.transactionId}
            senderPhoneError={errors.senderPhone}
            onTransactionIdChange={(value) => updateManualPayment("transactionId", value)}
            onTransactionIdBlur={() => handleBlur("transactionId")}
            onSenderPhoneChange={(value) => updateManualPayment("senderPhone", value)}
            onSenderPhoneBlur={() => handleBlur("senderPhone")}
          />
        )}
      </CheckoutSection>

      {/* 5 - Order review */}
      <CheckoutSection
        step={5}
        title="Order review"
        description="Please check your items before placing the order."
        icon={<ClipboardList className="h-4 w-4" />}
      >
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.quantity} × {formatPrice(item.product.sellingPrice)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatPrice(item.product.sellingPrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <Separator className="mt-2" />

        {/*
          These figures come straight from the backend quote. When no quote is
          available yet (no location chosen, still calculating, or unavailable)
          the storefront shows the cart subtotal as a preview and clearly labels
          it as not yet final - it never invents a delivery fee.
        */}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatPrice(preview.totals?.subtotal ?? subtotal)}
            </dd>
          </div>
          {preview.totals && preview.totals.discount > 0 && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">
                Discount{preview.totals.coupon ? ` (${preview.totals.coupon.code})` : ""}
              </dt>
              <dd className="font-semibold tabular-nums text-success">
                −{formatPrice(preview.totals.discount)}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd className="text-right">
              <DeliveryFeeLabel preview={preview} />
            </dd>
          </div>
        </dl>

        <Separator className="mt-4" />

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="font-label text-sm font-medium text-foreground">
            {preview.totals ? "Total" : "Estimated total"}
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatPrice(preview.totals?.total ?? subtotal)}
          </span>
        </div>
      </CheckoutSection>

      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{submitError.title}</p>
              <p className="leading-relaxed text-muted-foreground">{submitError.description}</p>
              {submitError.reviewCart && (
                <Button variant="link" asChild size="sm" className="h-auto px-0">
                  <Link href="/cart">Return to cart</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Place order */}
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {preview.totals ? "Total" : "Estimated total"}
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {formatPrice(preview.totals?.total ?? subtotal)}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Delivery and totals are calculated by Self Aura from your address, and confirmed again
          when your order is placed.
        </p>
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          isLoading={submitting}
          disabled={availableMethods.length === 0 || !canPlaceOrder}
        >
          Place Order
        </Button>
        {preview.status === "unavailable" && (
          <p role="alert" className="mt-3 text-center text-xs leading-relaxed text-destructive">
            {preview.message ?? "Delivery is not available for this location."}
          </p>
        )}
        {preview.status === "error" && (
          <p role="alert" className="mt-3 text-center text-xs leading-relaxed text-destructive">
            {preview.message ?? "Unable to calculate delivery. Please try again."}
          </p>
        )}
        {canPlaceOrder && (
          <p className="mt-3 text-center text-xs text-muted-foreground">{placeOrderHint}</p>
        )}
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- */
/* Delivery quote display                                            */
/* ---------------------------------------------------------------- */

interface DeliveryDisplayProps {
  preview: UseCheckoutPreviewResult;
}

/**
 * The concise delivery fee line for the order review and totals.
 *
 * Reads only the backend quote. It never derives a fee, and it distinguishes
 * every state the customer can be in: still loading, needs a location,
 * available (including free delivery), and unavailable for the location.
 */
function DeliveryFeeLabel({ preview }: DeliveryDisplayProps) {
  if (preview.status === "calculating") {
    return <span className="text-muted-foreground">Calculating…</span>;
  }

  if (preview.status === "unavailable") {
    return <span className="font-medium text-destructive">Unavailable</span>;
  }

  if (preview.status === "error") {
    return <span className="font-medium text-destructive">Not calculated</span>;
  }

  if (!preview.totals) {
    return <span className="text-muted-foreground">Select a delivery option</span>;
  }

  const { delivery } = preview.totals;

  if (delivery.freeDeliveryApplied) {
    return <span className="font-semibold text-success">FREE</span>;
  }

  return (
    <span className="font-semibold tabular-nums text-foreground">
      {formatPrice(delivery.appliedDeliveryFee)}
    </span>
  );
}

/**
 * The expanded delivery panel: which rule applies, what it costs, and whether
 * free delivery was earned. All values are the backend's.
 */
function DeliveryQuotePanel({ preview }: DeliveryDisplayProps) {
  if (preview.status === "calculating") {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Calculating delivery…
      </p>
    );
  }

  if (preview.status === "unavailable") {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
      >
        <p className="font-medium text-foreground">Delivery is not available for this location.</p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          {preview.message ??
            "We can't deliver to this location yet. Please check your address or contact us."}
        </p>
      </div>
    );
  }

  if (preview.status === "error") {
    return (
      <p
        role="alert"
        className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
      >
        {preview.message ?? "Unable to calculate delivery. Please try again."}
      </p>
    );
  }

  if (!preview.totals) {
    if (preview.selectedRuleId) {
      return (
        <p className="text-sm text-muted-foreground" role="status">
          Calculating delivery…
        </p>
      );
    }
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">
        Select a delivery option to see the charge.
      </p>
    );
  }

  const { delivery } = preview.totals;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Delivery option</span>
        <span className="font-medium text-foreground">{delivery.ruleName}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Delivery fee</span>
        <DeliveryFeeLabel preview={preview} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Estimated arrival</span>
        <span className="text-foreground">
          {delivery.estimatedMinDays}–{delivery.estimatedMaxDays} days
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Small presentational pieces                                       */
/* ---------------------------------------------------------------- */

interface CheckoutSectionProps {
  step: number;
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}

function CheckoutSection({ step, title, description, icon, children }: CheckoutSectionProps) {
  return (
    <section
      aria-labelledby={`checkout-section-${step}`}
      className="rounded-lg border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-label text-primary-foreground"
          aria-hidden="true"
        >
          {step}
        </span>
        <h2
          id={`checkout-section-${step}`}
          className="font-display text-lg font-medium tracking-tight text-foreground sm:text-xl"
        >
          {title}
        </h2>
        <span className="text-muted-foreground" aria-hidden="true">
          {icon}
        </span>
      </div>
      {description && (
        <p className="mt-1.5 pl-10 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

interface ChoiceOptionProps {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  description: string;
  onChange: () => void;
}

/** Native, accessible radio row (keyboard arrow navigation via same `name`). */
function ChoiceOption({ name, value, checked, title, description, onChange }: ChoiceOptionProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
        checked
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted-foreground/40"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

/* ---------------------------------------------------------------- */
/* Manual (bKash / Nagad) payment panel                              */
/* ---------------------------------------------------------------- */

interface ManualPaymentPanelProps {
  method: CheckoutPaymentMethod;
  /** Current checkout amount - shown so the customer sends the right sum. */
  subtotal: number;
  /**
   * Merchant receiving number for this method, fetched from the backend
   * public payment-settings endpoint - never hardcoded in the UI.
   */
  paymentNumber: string;
  /** True while the backend payment settings are still being fetched. */
  loading: boolean;
  transactionId: string;
  senderPhone: string;
  transactionIdError?: string;
  senderPhoneError?: string;
  onTransactionIdChange: (value: string) => void;
  onTransactionIdBlur: () => void;
  onSenderPhoneChange: (value: string) => void;
  onSenderPhoneBlur: () => void;
}

/**
 * Instructions panel shown when the customer selects bKash/Nagad.
 *
 * The merchant number comes from the backend's public payment-settings
 * endpoint - never hardcoded in the UI. The customer submits their
 * transaction id as a CLAIM; this panel explicitly says Self Aura verifies it
 * later. The storefront never marks the payment verified and never stores
 * PINs/OTPs/passwords.
 */
function ManualPaymentPanel({
  method,
  subtotal,
  paymentNumber,
  loading,
  transactionId,
  senderPhone,
  transactionIdError,
  senderPhoneError,
  onTransactionIdChange,
  onTransactionIdBlur,
  onSenderPhoneChange,
  onSenderPhoneBlur,
}: ManualPaymentPanelProps) {
  const label = CHECKOUT_PAYMENT_LABELS[method];
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  async function copyNumber() {
    if (!paymentNumber) return;
    try {
      await navigator.clipboard?.writeText(paymentNumber);
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable - the number remains selectable text.
    }
  }

  const steps = [
    `Select ${label}.`,
    `Send the exact order amount to Self Aura's ${label} payment number.`,
    "Copy the Transaction ID from your successful payment.",
    "Enter the Transaction ID below.",
    "Place the order — Self Aura verifies your payment.",
  ];

  return (
    <div className="rounded-md border border-accent/30 bg-accent/5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-accent" aria-hidden="true" />
        <h3 className="font-label text-sm font-semibold text-foreground">{label} Payment</h3>
      </div>

      <ol className="mt-4 space-y-2.5">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-label text-accent"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-md border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Send the exact order amount ({formatPrice(subtotal)}) to:
        </p>
        {loading ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading payment details…</p>
        ) : paymentNumber ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-semibold tabular-nums tracking-wide text-foreground">
              {paymentNumber}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyNumber}
              aria-label={`Copy ${label} payment number`}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-warning">
            The Self Aura {label} payment number isn&rsquo;t configured yet — please choose Cash on
            Delivery or check back soon.
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Use the amount shown above — the final total is confirmed by Self Aura when your order is
          placed.
        </p>
      </div>

      <div className="mt-4 grid gap-5">
        <Input
          id={FIELD_IDS.transactionId}
          label="Transaction ID"
          name="transactionId"
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 9HX7K2P4Q1"
          required
          value={transactionId}
          error={transactionIdError}
          onChange={(event) => onTransactionIdChange(event.target.value)}
          onBlur={onTransactionIdBlur}
        />
        <Input
          id={FIELD_IDS.senderPhone}
          label="Sender phone number"
          name="senderPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Optional"
          helperText="The number you paid from — optional."
          value={senderPhone}
          error={senderPhoneError}
          onChange={(event) => onSenderPhoneChange(event.target.value)}
          onBlur={onSenderPhoneBlur}
        />
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        <span>
          Your payment will be verified by Self Aura after the order is submitted. Your transaction
          id is not proof of payment — Self Aura confirms it before your order is dispatched.
        </span>
      </p>
    </div>
  );
}