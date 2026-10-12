/**
 * Bangladesh phone helpers for the checkout form.
 *
 * Self Aura is a Bangladesh-based business. The backend stores the phone
 * string as typed (its validator only checks the digit count, 7..15) - so
 * normalization never needs to corrupt the value: we trim and collapse
 * common separator characters, keep a legitimate leading "+", and let the
 * customer's own format through.
 */

const DIGITS_ONLY = /\D/g;
const SEPARATORS = /[\s()\-]/g;

/** Trim + collapse spaces/dashes/parens. Keeps a leading "+" intact. */
export function normalizeBangladeshPhone(value: string): string {
  return value.trim().replace(SEPARATORS, "");
}

/**
 * Accepts the common self-service formats:
 *   01XXXXXXXXX    - 11-digit local
 *   +8801XXXXXXXXX - 13-digit international
 * plus a lenient 11..15 digit fallback so legitimate numbers are never
 * over-restricted (the backend itself allows 7..15 digits).
 */
export function isValidBangladeshPhone(value: string): boolean {
  const normalized = normalizeBangladeshPhone(value);
  const digits = normalized.replace(DIGITS_ONLY, "");
  if (digits.length === 0) return false;
  if (/^01\d{9}$/.test(normalized)) return true;
  if (/^\+8801\d{9}$/.test(normalized)) return true;
  return digits.length >= 11 && digits.length <= 15;
}