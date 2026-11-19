/**
 * Bangladesh phone helpers for the checkout form.
 *
 * Self Aura is a Bangladesh-based business. Numbers are
 * normalised to digits (plus an optional leading "+") before being sent.
 */

/** Valid BD mobile: optional +88 / 88, then 01[3-9] and 8 more digits. */
const BD_MOBILE = /^(?:\+?88)?01[3-9]\d{8}$/;

/**
 * Strips everything except digits, keeping a single leading "+".
 * "+880 1712-345 678" -> "+8801712345678".
 */
export function normalizeBangladeshPhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

/**
 * Accepts Bangladeshi mobile numbers in the common self-service formats:
 *   01XXXXXXXXX     - 11-digit local
 *   8801XXXXXXXXX   - without "+"
 *   +8801XXXXXXXXX  - international
 * The operator digit must be 3-9 (013..019). Letters or other junk are
 * rejected rather than silently stripped.
 */
export function isValidBangladeshPhone(value: string): boolean {
  if (/[^\d\s()+\-.]/.test(value.trim())) return false;
  return BD_MOBILE.test(normalizeBangladeshPhone(value));
}
