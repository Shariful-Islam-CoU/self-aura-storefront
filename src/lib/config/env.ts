/**
 * Public site configuration.
 *
 * Only NEXT_PUBLIC_-prefixed variables are exposed to the browser. Never read
 * backend/MongoDB/JWT secrets inside this project.
 */

const DEFAULT_API_URL = "https://self-aura-backend.onrender.com/api";
// const DEFAULT_API_URL = "http://localhost:5000/api";
const DEFAULT_SITE_URL = "https://self-aura.shop";
// const DEFAULT_SITE_URL = "http://localhost:3001";

function readPublicEnvVar(name: string, fallback: string): string {
  const value = process.env[name];
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
  apiUrl: readPublicEnvVar("NEXT_PUBLIC_API_URL", DEFAULT_API_URL),
  siteUrl: readPublicEnvVar("NEXT_PUBLIC_SITE_URL", DEFAULT_SITE_URL),
} as const;