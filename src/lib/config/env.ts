/**
 * Public site configuration.
 *
 * Only NEXT_PUBLIC_-prefixed variables are exposed to the browser. Never read
 * backend/MongoDB/JWT secrets inside this project.
 */

const DEFAULT_API_URL = "https://api.self-aura.shop/api";
// const DEFAULT_API_URL = "https://self-aura-backend.onrender.com/api";
// const DEFAULT_API_URL = "http://localhost:5000/api";
const DEFAULT_SITE_URL = "https://self-aura.shop";
// const DEFAULT_SITE_URL = "http://localhost:3001";

// NOTE: callers must pass `process.env.NEXT_PUBLIC_X` written out literally.
// Next.js only inlines NEXT_PUBLIC_ vars into the browser bundle for literal
// member accesses; a dynamic `process.env[name]` is always undefined there.
function readPublicEnvVar(
  name: string,
  value: string | undefined,
  fallback: string,
): string {
  if (!value) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[config] ${name} is not set - using fallback "${fallback}".`);
    }
    return fallback;
  }
  return value.replace(/\/+$/, ""); // strip trailing slashes for safe joins
}

export const siteConfig = {
  name: "Self Aura",
  description:
    "Self Aura — premium curated collection of jewelry and lifestyle pieces.",
  apiUrl: readPublicEnvVar("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL, DEFAULT_API_URL),
  siteUrl: readPublicEnvVar("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL),
} as const;