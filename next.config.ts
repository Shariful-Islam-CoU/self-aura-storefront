import type { NextConfig } from "next";

/**
 * The object form of a `remotePatterns` entry, taken straight from the
 * NextConfig type rather than re-declared, so a change in Next's image config
 * shape surfaces here as a type error instead of a runtime surprise.
 */
type RemotePattern = Exclude<
  NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number],
  URL
>;

/**
 * Cloudinary cloud name shape.
 *
 * A cloud name is the first DNS label of a Cloudinary hostname: lowercase
 * letters, digits and dashes, 3-64 characters, and it cannot start or end with a
 * dash. Cloudinary assigns it, so it is never arbitrary user input, but it DOES
 * come from an environment variable - and this string is interpolated into a
 * path pattern. Anything outside this shape is rejected outright, because a
 * value like `*` or `../../` would otherwise widen the allow-list.
 */
const CLOUD_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

/**
 * Builds the `next/image` allow-list for this deployment's Cloudinary cloud.
 *
 * Product and category media is delivered from `res.cloudinary.com`, so two
 * scoped patterns are needed:
 *
 *   - `/{cloud}/image/upload/**` - product images and category thumbnails.
 *   - `/{cloud}/video/upload/**` - video POSTER frames. Cloudinary serves a
 *     still from the video tree, so a poster is an image request whose URL
 *     happens to live under `/video/upload/`. Without this pattern every
 *     product with a clip would show a broken poster in the gallery.
 *
 * Scope, and why it is this tight:
 *   - `res.cloudinary.com` is one host, never a wildcard. A `**` hostname would
 *     turn `next/image` into an open proxy for arbitrary third-party URLs and
 *     exfiltrate visitor IPs and referrers.
 *   - the cloud name is included in the path, so this deployment's config
 *     cannot be used to serve another cloud's assets.
 *   - only the `upload` tree is allowed. `fetch`, `authenticated` and the
 *     authenticated delivery types are not referenced by this app and are not
 *     reachable.
 *   - `https` only. Allowing `http` would let a network attacker rewrite a
 *     product photo in transit.
 *
 * Returns an empty list (with a warning) when the variable is missing or
 * malformed. That is the right failure mode: an unset variable degrades the app
 * to its styled placeholders, while a permissive pattern would be a security
 * hole that only shows up under attack.
 */
function readCloudinaryPatterns(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!raw) {
    // Not an error: a preview deployment or a test run legitimately has no
    // Cloudinary. Product images simply fall back to their placeholders.
    return [];
  }

  if (!CLOUD_NAME_PATTERN.test(raw)) {
    console.warn(
      "[next.config] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not a valid Cloudinary " +
        "cloud name, so no Cloudinary image pattern was added. Product images will " +
        "fall back to their placeholder. Expected lowercase letters, digits and " +
        "dashes, 3-64 characters."
    );
    return [];
  }

  return ["image", "video"].map((resourceType) => ({
    protocol: "https",
    hostname: "res.cloudinary.com",
    // Cloudinary's delivery host is on 443 and nothing else; pinning the port
    // to empty keeps the pattern from matching a service on another port that
    // happens to answer to the same name.
    port: "",
    pathname: `/${raw}/${resourceType}/upload/**`,
  }));
}

/**
 * Extra trusted image origins.
 *
 * Kept for BACKWARD COMPATIBILITY only. New media is delivered from Cloudinary
 * over absolute URLs, but products uploaded before the migration still hold
 * root-relative `/media/<key>` paths which the adapter resolves against the API
 * origin - so the API has to stay allow-listed until every such record has been
 * re-uploaded. Anything genuinely new belongs on Cloudinary, not in this list.
 *
 * This is an ALLOW-LIST of specific origins, never a wildcard. Sources:
 *   - `NEXT_PUBLIC_API_URL` covers local development and any single-host
 *     deployment where the API serves the media itself.
 *   - `NEXT_PUBLIC_MEDIA_HOSTS` is a comma-separated allow-list of extra
 *     trusted origins, for a deployment that fronts media on a separate host.
 *     Unset by default; nothing is hardcoded.
 */
function readMediaOrigins(): RemotePattern[] {
  const origins: RemotePattern[] = [];

  const addFromUrl = (value: string | undefined) => {
    if (!value) return;
    try {
      const url = new URL(value);
      const protocol = url.protocol.replace(":", "");
      if (protocol !== "http" && protocol !== "https") return;
      origins.push({
        protocol,
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
      });
    } catch {
      // A malformed URL is ignored rather than silently allowing everything.
    }
  };

  // The API origin is always a trusted image source.
  addFromUrl(process.env.NEXT_PUBLIC_API_URL ?? "https://self-aura-backend.onrender.com/api");

  // Optional extra trusted media origins.
  for (const entry of (process.env.NEXT_PUBLIC_MEDIA_HOSTS ?? "").split(",")) {
    const trimmed = entry.trim();
    if (trimmed.length > 0) addFromUrl(trimmed);
  }

  // Loopback without an explicit port, for the common local case.
  for (const host of ["localhost", "127.0.0.1"]) {
    if (!origins.some((origin) => origin.hostname === host)) {
      origins.push({ protocol: "http", hostname: host });
    }
  }

  return origins;
}

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // This project sits beside the backend in a multi-lockfile workspace;
  // pin Turbopack's root to this project so it doesn't infer the parent
  // directory as the application root.
  turbopack: {
    root: __dirname,
  },

  // No `unoptimized: true` here on purpose: every product image is optimised
  // through the Next image pipeline, which resizes per `sizes` and converts to
  // a modern format. That is a large part of why the card and gallery pass
  // explicit `sizes` values. Cloudinary also applies its own `f_auto`/`q_auto`
  // upstream, so the two layers compose rather than fight.
  images: {
    remotePatterns: [...readCloudinaryPatterns(), ...readMediaOrigins()],
  },

  // Allow Google Identity Services popup to communicate (fixes COOP errors)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
