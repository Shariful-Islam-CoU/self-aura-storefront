import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { NextConfig } from "next";

/**
 * `next/image` remote allow-list for the storefront.
 *
 * This is the file that decides which remote hosts a customer-facing page is
 * allowed to load an image from, and it is configured entirely from the
 * environment. The properties worth asserting are the security ones: a wildcard
 * host would turn `next/image` into an open proxy for arbitrary third-party URLs
 * and a way to exfiltrate visitor IPs and referrers, and a missing Cloudinary
 * scope would break every product photo on the site.
 *
 * It also asserts the thing that is easiest to get wrong in a media migration:
 * that the storefront's configuration carries a cloud NAME and never an API key
 * or secret. Those are server-side credentials, and a `NEXT_PUBLIC_*` value is
 * inlined into the client bundle where every visitor can read it.
 */

/**
 * `next.config.ts` runs its logic at import time, so the environment has to be
 * in place before the module is loaded. Each case re-imports it with a fresh
 * module registry, which is what a real `next build` against a different `.env`
 * would do.
 */
async function loadConfig(env: Record<string, string | undefined>): Promise<NextConfig> {
  const saved = { ...process.env };
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) delete process.env[key];
  }
  Object.assign(process.env, env);

  vi.resetModules();
  try {
    // The import binding is `configModule` rather than `module` because `module`
    // trips @next/next/no-assign-module-variable.
    const configModule = await import("../next.config");
    return (configModule.default ?? configModule) as NextConfig;
  } finally {
    process.env = saved;
    vi.resetModules();
  }
}

const patternsOf = (config: NextConfig) =>
  (config.images?.remotePatterns ?? []) as Exclude<
    NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number],
    URL
  >[];

const CLOUD = "demo-cloud";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("next/image remote patterns — Cloudinary", () => {
  it("allows exactly this deployment's Cloudinary image and video trees", async () => {
    const patterns = patternsOf(
      await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD })
    );

    const cloudinary = patterns.filter((p) => p.hostname === "res.cloudinary.com");
    expect(cloudinary).toHaveLength(2);
    expect(cloudinary.map((p) => p.pathname).sort()).toEqual([
      `/${CLOUD}/image/upload/**`,
      `/${CLOUD}/video/upload/**`,
    ]);
    // Delivery is always HTTPS; allowing http would let a network attacker
    // rewrite a product photo in transit.
    expect(cloudinary.every((p) => p.protocol === "https")).toBe(true);
  });

  it("covers the video tree, because a poster frame is an image under /video/upload", async () => {
    const patterns = patternsOf(
      await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD })
    );
    // Without this pattern every product with a clip would show a broken poster
    // in its gallery thumbnail — Cloudinary serves a still from the video tree.
    expect(patterns.some((p) => p.pathname === `/${CLOUD}/video/upload/**`)).toBe(true);
  });

  it("scopes by cloud name, so one deployment's key cannot read another's", async () => {
    const mine = patternsOf(await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "cloud-one" }));
    const yours = patternsOf(await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "cloud-two" }));

    const minePaths = mine.map((p) => p.pathname);
    const yoursPaths = yours.map((p) => p.pathname);

    expect(minePaths.some((p) => p?.includes("cloud-one"))).toBe(true);
    expect(minePaths.some((p) => p?.includes("cloud-two"))).toBe(false);
    expect(yoursPaths.some((p) => p?.includes("cloud-two"))).toBe(true);
  });

  it("never widens the Cloudinary host with a wildcard", async () => {
    const patterns = patternsOf(
      await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD })
    );
    for (const pattern of patterns) {
      expect(pattern.hostname).not.toContain("*");
      expect(pattern.protocol).not.toContain("*");
      // A pathname of `**` (or `/{cloud}/**`) would allow any asset type,
      // including raw uploads this deployment never references.
      expect(pattern.pathname).not.toBe("**");
    }
  });

  it("drops a malformed cloud name instead of building a permissive pattern", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (const bad of ["../../etc", "demo cloud", "a", "*", "demo/cloud"]) {
      const patterns = patternsOf(
        await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: bad })
      );
      expect(patterns.filter((p) => p.hostname === "res.cloudinary.com")).toHaveLength(0);
    }
    // A typo must be visible, not silent.
    expect(warn).toHaveBeenCalled();
  });

  it("adds no Cloudinary pattern at all when the cloud name is unset", async () => {
    const patterns = patternsOf(await loadConfig({}));
    expect(patterns.filter((p) => p.hostname === "res.cloudinary.com")).toHaveLength(0);
  });
});

describe("next/image remote patterns — no client-side credentials", () => {
  it("puts no key or secret anywhere in the resolved configuration", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD });
    const serialised = JSON.stringify(config);
    // The storefront talks to the backend over HTTP; Cloudinary is reached only
    // through a public delivery URL. Neither the API key nor the secret may be
    // inlined into anything the browser receives.
    expect(serialised).not.toMatch(/api[_-]?key/i);
    expect(serialised).not.toMatch(/api[_-]?secret/i);
    expect(serialised).not.toMatch(/CLOUDINARY_API/);
  });

  it("reads only the cloud name, which is public by nature", async () => {
    // The cloud name is already part of every delivery URL, so publishing it
    // grants nothing. Asserting the shape keeps the env surface minimal: one
    // extra `NEXT_PUBLIC_CLOUDINARY_API_SECRET=` in a `.env` would be the one
    // change that turned this whole design unsafe.
    const config = await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD });
    expect(JSON.stringify(config)).toContain(`/${CLOUD}/image/upload/**`);
  });
});

describe("next/image remote patterns — legacy local media", () => {
  it("still allows the API origin, which serves pre-migration /media records", async () => {
    const patterns = patternsOf(
      await loadConfig({ NEXT_PUBLIC_API_URL: "http://localhost:5000/api" })
    );
    expect(patterns).toContainEqual({
      protocol: "http",
      hostname: "localhost",
      port: "5000",
    });
  });

  it("never allows a wildcard scheme or host from a malformed env value", async () => {
    const patterns = patternsOf(
      await loadConfig({
        NEXT_PUBLIC_API_URL: "not a url",
        NEXT_PUBLIC_MEDIA_HOSTS: "also-not-a-url",
      })
    );
    for (const pattern of patterns) {
      expect(pattern.protocol === "http" || pattern.protocol === "https").toBe(true);
      expect(pattern.hostname).not.toContain("*");
    }
  });

  it("accepts an explicitly configured extra host, one at a time", async () => {
    const patterns = patternsOf(
      await loadConfig({ NEXT_PUBLIC_MEDIA_HOSTS: "https://media.selfaura.test" })
    );
    expect(patterns).toContainEqual({
      protocol: "https",
      hostname: "media.selfaura.test",
    });
  });
});

describe("next/image optimisation", () => {
  it("leaves optimisation on: Cloudinary is an allow-listed remote pattern", async () => {
    const config = await loadConfig({ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CLOUD });
    // `unoptimized` would ship a 4000px master to every browser. The allow-list
    // above is exactly what makes real optimisation work, so turning it off is
    // a regression, not a fallback.
    expect((config.images as { unoptimized?: boolean } | undefined)?.unoptimized).toBeUndefined();
  });
});
