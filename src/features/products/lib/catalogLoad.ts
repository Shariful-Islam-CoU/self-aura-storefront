/**
 * Result type for a catalogue fetch that is allowed to fail.
 *
 * The catalogue pages must render a customer-friendly error state instead of
 * throwing, so they need to branch on success/failure *and* keep the value
 * narrowed on the success path. Doing that with a bare `let` plus a separate
 * `failure` flag is easy to get subtly wrong (a thrown `undefined`, or a
 * compiler-forgetful read), so the result is modelled explicitly instead.
 */
export type CatalogLoad<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Run a catalogue fetch, converting a rejection into a `CatalogLoad` failure.
 *
 * This never rethrows: the caller decides whether an unavailable catalogue is
 * a page-level error state.
 */
export async function loadCatalog<T>(fn: () => Promise<T>): Promise<CatalogLoad<T>> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
}
