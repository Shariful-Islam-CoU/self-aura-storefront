/**
 * Client-side checkout form validation.
 *
 * Length limits mirror the backend schema (orderValidators.ts) so valid
 * input here is valid there too - the backend revalidates and remains the
 * authority. Phone checks are deliberately Bangladesh-friendly but lenient
 * (see phone.ts). Errors live close to their fields.
 */
import type {
  CheckoutField,
  CheckoutFieldErrors,
  CheckoutFormValues,
  CheckoutValidationResult,
} from "../types";
import { isManualPaymentMethod } from "../types";
import { isValidBangladeshPhone, normalizeBangladeshPhone } from "./phone";

const MAX_FULL_NAME = 100; // backend shippingAddress.recipientName
const MAX_ADDRESS_LINE = 200;
const MAX_AREA = 100;
const MAX_DISTRICT = 100;
const MAX_CITY = 100;
const MAX_POSTAL_CODE = 20;
const MAX_COUNTRY = 100;
const MAX_DELIVERY_NOTE = 2000; // backend order note
const MIN_TRANSACTION_ID = 6; // lenient - no provider-specific format enforced
const MAX_TRANSACTION_ID = 200; // mirrors backend Payment.reference max length

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutValidationResult {
  const errors: CheckoutFieldErrors = {};

  const fullName = values.customer.fullName.trim();
  if (!fullName) {
    errors.fullName = "Full name is required.";
  } else if (fullName.length > MAX_FULL_NAME) {
    errors.fullName = `Full name must be at most ${MAX_FULL_NAME} characters.`;
  }

  const phone = normalizeBangladeshPhone(values.customer.phone);
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!isValidBangladeshPhone(phone)) {
    errors.phone = "Enter a valid phone number, e.g. 01XXXXXXXXX or +8801XXXXXXXXX.";
  }

  const addressLine = values.address.addressLine.trim();
  if (!addressLine) {
    errors.addressLine = "Delivery address is required.";
  } else if (addressLine.length > MAX_ADDRESS_LINE) {
    errors.addressLine = `Address must be at most ${MAX_ADDRESS_LINE} characters.`;
  }

  const area = values.address.area.trim();
  if (area.length > MAX_AREA) {
    errors.area = `Area must be at most ${MAX_AREA} characters.`;
  }

  const district = values.address.district.trim();
  if (!district) {
    errors.district = "District is required.";
  } else if (district.length > MAX_DISTRICT) {
    errors.district = `District must be at most ${MAX_DISTRICT} characters.`;
  }

  const city = values.address.city.trim();
  if (city.length > MAX_CITY) {
    errors.city = `City must be at most ${MAX_CITY} characters.`;
  }

  const postalCode = values.address.postalCode.trim();
  if (postalCode.length > MAX_POSTAL_CODE) {
    errors.postalCode = `Postal code must be at most ${MAX_POSTAL_CODE} characters.`;
  }

  const country = values.address.country.trim();
  if (country.length > MAX_COUNTRY) {
    errors.country = `Country must be at most ${MAX_COUNTRY} characters.`;
  }

  const facebookName = values.customer.facebookName?.trim() || "";
  if (facebookName.length > 120) {
    errors.facebookName = "Facebook name must be at most 120 characters.";
  }

  const facebookUrl = values.customer.facebookProfileUrl?.trim() || "";
  if (facebookUrl) {
    try {
      const url = new URL(facebookUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.facebookProfileUrl = "Facebook profile URL must be a valid HTTP/HTTPS URL.";
      }
    } catch {
      errors.facebookProfileUrl = "Facebook profile URL must be a valid HTTP/HTTPS URL.";
    }
  }

  const deliveryNote = values.address.deliveryNote.trim();
  if (deliveryNote.length > MAX_DELIVERY_NOTE) {
    errors.deliveryNote = `Delivery instructions must be at most ${MAX_DELIVERY_NOTE} characters.`;
  }

  // Manual bKash/Nagad payments require the customer's claimed transaction id
  // (trimmed, length-checked only - no provider format is enforced). Sender
  // phone is optional; when given it should look like a phone number.
  if (isManualPaymentMethod(values.paymentMethod)) {
    const transactionId = values.manualPayment.transactionId.trim();
    if (!transactionId) {
      errors.transactionId = "Transaction ID is required for bKash/Nagad payments.";
    } else if (transactionId.length < MIN_TRANSACTION_ID) {
      errors.transactionId = `Transaction ID must be at least ${MIN_TRANSACTION_ID} characters.`;
    } else if (transactionId.length > MAX_TRANSACTION_ID) {
      errors.transactionId = `Transaction ID must be at most ${MAX_TRANSACTION_ID} characters.`;
    }

    const senderPhone = values.manualPayment.senderPhone.trim();
    if (senderPhone && !isValidBangladeshPhone(senderPhone)) {
      errors.senderPhone = "Enter a valid sender phone number or leave it empty.";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Validate one field (used on blur). Reuses the full pass, returns one error. */
export function validateCheckoutField(
  values: CheckoutFormValues,
  field: CheckoutField
): string | undefined {
  return validateCheckoutForm(values).errors[field];
}