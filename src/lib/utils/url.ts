/**
 * Returns `raw` only when it is a same-origin path ("/account", "/shop?x=1").
 *
 * Anything else - absolute URLs, protocol-relative "//host", "/\host" (which
 * browsers treat as "//host"), `javascript:` and friends - falls back to
 * `fallback`. Use this for every post-login `?redirect=` value so the login
 * flow can never become an open redirect or a script-injection sink.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // Control characters / backslashes anywhere can be normalised by browsers
  // into something host-like; reject them outright.
  if (/[\u0000-\u001f\\]/.test(value)) return fallback;
  return value;
}

/**
 * Returns `raw` only when it is an absolute http(s) URL, otherwise `null`.
 * Use for hrefs that come from backend data (tracking links, social profiles).
 */
export function safeExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Serialises JSON-LD so it is safe inside a `<script>` element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
