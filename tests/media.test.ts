import { describe, expect, it } from "vitest";
import {
  buildGalleryItems,
  getPrimaryImage,
  normalizeOrder,
  resolveMediaUrl,
} from "@/features/products/lib/media";
import {
  mapCategoryResponse,
  mapCategoryThumbnail,
  mapProductImages,
  mapProductResponse,
  mapProductVideos,
} from "@/features/products/lib/catalogMappers";
import type {
  ProductImage,
  ProductImageResponse,
  ProductResponse,
  ProductVideoResponse,
} from "@/types";

/**
 * Unit tests for the storefront media adapters.
 *
 * These cover the rules every product and category surface depends on and that
 * are easy to regress silently: a stored URL must become something
 * `next/image` can actually load, the image list must stay in canonical order
 * so position 0 is unambiguously the primary image, and a video's failure modes
 * must be independent of its poster's.
 *
 * The Cloudinary cases are the common ones; the legacy `/media/<key>` cases
 * exist because products uploaded before the migration still hold those paths
 * and must keep rendering.
 */

// The API origin comes from NEXT_PUBLIC_API_URL, defaulted in
// src/lib/config/env.ts to http://localhost:5000/api
const API_ORIGIN = "http://localhost:5000";
const CLOUD = "https://res.cloudinary.com/dzcqtjtiw";
const cdnImage = (path: string) =>
  `${CLOUD}/image/upload/f_auto,q_auto/c_limit,w_2000/v1/self-aura/${path}`;
const cdnVideo = (path: string) => `${CLOUD}/video/upload/f_mp4/v1/self-aura/${path}`;
const cdnPoster = (path: string) =>
  `${CLOUD}/video/upload/so_1,f_jpg/v1/self-aura/${path}`;

describe("resolveMediaUrl", () => {
  it("leaves an absolute http(s) URL untouched", () => {
    expect(resolveMediaUrl("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg"
    );
    expect(resolveMediaUrl("http://localhost:5000/media/x.png")).toBe(
      "http://localhost:5000/media/x.png"
    );
  });

  it("leaves a Cloudinary delivery URL untouched", () => {
    // The overwhelmingly common case: new media arrives already absolute, and
    // rewriting it against the API origin would 404.
    const url = cdnImage("products/p1/images/a1.png");
    expect(resolveMediaUrl(url)).toBe(url);
  });

  it("resolves a root-relative media URL against the API origin", () => {
    // Without this the storefront (port 3001) would request /media/x.png from
    // itself and 404 on every product uploaded before the Cloudinary migration.
    expect(resolveMediaUrl("/media/abc-123.png")).toBe(
      `${API_ORIGIN}/media/abc-123.png`
    );
  });

  it("returns null for missing or empty values so callers render a fallback", () => {
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("")).toBeNull();
    expect(resolveMediaUrl("   ")).toBeNull();
  });

  it("refuses a non-http(s) scheme", () => {
    expect(resolveMediaUrl("javascript:alert(1)")).toBeNull();
    expect(resolveMediaUrl("data:image/png;base64,AAAA")).toBeNull();
  });

  it("refuses a protocol-relative URL, which would escape to another origin", () => {
    expect(resolveMediaUrl("//evil.example.com/a.jpg")).toBeNull();
  });
});

describe("getPrimaryImage", () => {
  const images: ProductImage[] = [
    { url: "https://x/1.jpg", alt: "one", sortOrder: 0 },
    { url: "https://x/2.jpg", alt: "two", sortOrder: 1 },
    { url: "https://x/3.jpg", alt: "three", sortOrder: 2 },
  ];

  it("returns the entry with the lowest sortOrder", () => {
    expect(getPrimaryImage(images)?.url).toBe("https://x/1.jpg");
  });

  it("does not depend on array position", () => {
    const shuffled = [images[2], images[0], images[1]];
    expect(getPrimaryImage(shuffled)?.url).toBe("https://x/1.jpg");
  });

  it("returns undefined for an empty or missing list", () => {
    expect(getPrimaryImage([])).toBeUndefined();
    expect(getPrimaryImage(undefined)).toBeUndefined();
    expect(getPrimaryImage(null)).toBeUndefined();
  });
});

describe("normalizeOrder", () => {
  it("sorts by sortOrder and re-numbers densely from 0", () => {
    const result = normalizeOrder([
      { url: "https://x/c.jpg", alt: "c", sortOrder: 7 },
      { url: "https://x/a.jpg", alt: "a", sortOrder: 0 },
      { url: "https://x/b.jpg", alt: "b", sortOrder: 3 },
    ]);
    expect(result.map((image) => image.url)).toEqual([
      "https://x/a.jpg",
      "https://x/b.jpg",
      "https://x/c.jpg",
    ]);
    expect(result.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
  });

  it("does not mutate the input array", () => {
    const input: ProductImage[] = [
      { url: "https://x/b.jpg", alt: "b", sortOrder: 1 },
      { url: "https://x/a.jpg", alt: "a", sortOrder: 0 },
    ];
    normalizeOrder(input);
    expect(input[0].url).toBe("https://x/b.jpg");
  });
});

describe("mapProductImages", () => {
  it("maps the backend allow-list shape and keeps order", () => {
    const wire: ProductImageResponse[] = [
      { url: "/media/a.png", alt: "Front", sortOrder: 0 },
      { url: "/media/b.png", alt: "Back", sortOrder: 1 },
    ];
    const result = mapProductImages(wire, "Banarasi Saree");

    expect(result).toHaveLength(2);
    expect(result[0].url).toBe(`${API_ORIGIN}/media/a.png`);
    expect(result[0].alt).toBe("Front");
    expect(result.map((image) => image.sortOrder)).toEqual([0, 1]);
  });

  it("passes a Cloudinary delivery URL through unchanged", () => {
    const url = cdnImage("products/p1/images/aaa-1a2b3c.png");
    const [image] = mapProductImages([{ url, alt: "Front", sortOrder: 0 }], "Ring");
    expect(image.url).toBe(url);
  });

  it("exposes no field beyond url, alt and sortOrder", () => {
    const [image] = mapProductImages(
      [{ url: "/media/a.png", alt: "Front", sortOrder: 0 }],
      "Ring"
    );
    // A public response must not leak a storage key, MIME type, pixel size or
    // any server path; the storefront only ever needs these three.
    expect(Object.keys(image).sort()).toEqual(["alt", "sortOrder", "url"]);
  });

  it("falls back to the product name when alt text is blank", () => {
    const [image] = mapProductImages(
      [{ url: "/media/a.png", alt: "   ", sortOrder: 0 }],
      "Emerald Ring"
    );
    expect(image.alt).toBe("Emerald Ring product image");
  });

  it("drops an entry whose URL cannot be resolved instead of passing a broken src", () => {
    const result = mapProductImages(
      [
        { url: "/media/ok.png", alt: "Ok", sortOrder: 0 },
        { url: "javascript:alert(1)", alt: "Bad", sortOrder: 1 },
      ],
      "Ring"
    );
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe(`${API_ORIGIN}/media/ok.png`);
  });

  it("returns an empty list for no images, never a fabricated one", () => {
    expect(mapProductImages([], "Ring")).toEqual([]);
    expect(mapProductImages(undefined, "Ring")).toEqual([]);
    expect(mapProductImages(null, "Ring")).toEqual([]);
  });

  it("re-densifies a list that arrives with gaps in sortOrder", () => {
    const result = mapProductImages(
      [
        { url: "/media/a.png", alt: "A", sortOrder: 0 },
        { url: "/media/b.png", alt: "B", sortOrder: 5 },
        { url: "/media/c.png", alt: "C", sortOrder: 9 },
      ],
      "Ring"
    );
    expect(result.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
    expect(getPrimaryImage(result)?.url).toBe(`${API_ORIGIN}/media/a.png`);
  });
});

describe("mapProductVideos", () => {
  it("maps a Cloudinary clip with its poster frame", () => {
    const wire: ProductVideoResponse[] = [
      { url: cdnVideo("products/p1/videos/v1.mp4"), thumbnailUrl: cdnPoster("products/p1/videos/v1.jpg"), sortOrder: 0 },
    ];
    const [video] = mapProductVideos(wire, "Emerald Ring");

    expect(video.url).toBe(cdnVideo("products/p1/videos/v1.mp4"));
    expect(video.thumbnailUrl).toBe(cdnPoster("products/p1/videos/v1.jpg"));
    expect(video.sortOrder).toBe(0);
  });

  it("exposes no storage metadata, only what a player needs", () => {
    const [video] = mapProductVideos(
      [
        {
          url: cdnVideo("products/p1/videos/v1.mp4"),
          thumbnailUrl: cdnPoster("products/p1/videos/v1.jpg"),
          sortOrder: 0,
        },
      ],
      "Ring"
    );
    // The Cloudinary publicId, resourceType, byte size and container format are
    // management-side facts. Nothing here may reach a customer payload.
    expect(Object.keys(video).sort()).toEqual([
      "alt",
      "sortOrder",
      "thumbnailUrl",
      "url",
    ]);
  });

  it("keeps a clip whose poster is missing or unresolvable", () => {
    // A clip with no poster is still a clip the customer can watch; only the
    // decorative frame is lost, and the frame has its own fallback.
    const withoutPoster = mapProductVideos(
      [{ url: cdnVideo("products/p1/videos/v1.mp4"), sortOrder: 0 }],
      "Ring"
    );
    expect(withoutPoster).toHaveLength(1);
    expect(withoutPoster[0].thumbnailUrl).toBeUndefined();

    const withBadPoster = mapProductVideos(
      [
        {
          url: cdnVideo("products/p1/videos/v1.mp4"),
          thumbnailUrl: "javascript:alert(1)",
          sortOrder: 0,
        },
      ],
      "Ring"
    );
    expect(withBadPoster).toHaveLength(1);
    expect(withBadPoster[0].thumbnailUrl).toBeUndefined();
  });

  it("drops a clip whose own URL cannot be resolved", () => {
    // The mirror image: a clip that cannot be loaded cannot be offered.
    const result = mapProductVideos(
      [
        { url: "javascript:alert(1)", sortOrder: 0 },
        { url: cdnVideo("products/p1/videos/v2.mp4"), sortOrder: 1 },
      ],
      "Ring"
    );
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe(cdnVideo("products/p1/videos/v2.mp4"));
  });

  it("keeps the backend's ordering", () => {
    const result = mapProductVideos(
      [
        { url: cdnVideo("v2.mp4"), sortOrder: 1 },
        { url: cdnVideo("v1.mp4"), sortOrder: 0 },
        { url: cdnVideo("v3.mp4"), sortOrder: 2 },
      ],
      "Ring"
    );
    expect(result.map((video) => video.url)).toEqual([
      cdnVideo("v1.mp4"),
      cdnVideo("v2.mp4"),
      cdnVideo("v3.mp4"),
    ]);
    expect(result.map((video) => video.sortOrder)).toEqual([0, 1, 2]);
  });

  it("falls back to a product-derived description rather than an empty alt", () => {
    const [video] = mapProductVideos(
      [{ url: cdnVideo("v1.mp4"), alt: "  ", sortOrder: 0 }],
      "Emerald Ring"
    );
    expect(video.alt).toBe("Emerald Ring product video");
  });

  it("returns an empty list when there are no clips, never a fabricated one", () => {
    expect(mapProductVideos([], "Ring")).toEqual([]);
    expect(mapProductVideos(undefined, "Ring")).toEqual([]);
    expect(mapProductVideos(null, "Ring")).toEqual([]);
  });
});

describe("mapProductResponse", () => {
  const wire = (overrides: Partial<ProductResponse> = {}): ProductResponse => ({
    id: "p1",
    name: "Emerald Ring",
    slug: "emerald-ring",
    sku: "SA-RNG-001",
    category: { id: "c1", name: "Jewelry" },
    images: [{ url: cdnImage("products/p1/images/a1.png"), alt: "Front", sortOrder: 0 }],
    videos: [],
    sellingPrice: 4200,
    stock: 5,
    lowStock: false,
    ...overrides,
  });

  it("always yields a videos array, even when the payload omits it", () => {
    // Defensive: the backend always sends the key, but a cached or hand-edited
    // payload should not make the gallery throw.
    const legacy = wire();
    delete (legacy as { videos?: unknown }).videos;
    expect(mapProductResponse(legacy).videos).toEqual([]);
  });

  it("carries the Cloudinary image and video through to the display shape", () => {
    const product = mapProductResponse(
      wire({
        videos: [
          {
            url: cdnVideo("products/p1/videos/v1.mp4"),
            thumbnailUrl: cdnPoster("products/p1/videos/v1.jpg"),
            sortOrder: 0,
            alt: "Ring on a stand",
          },
        ],
      })
    );
    expect(getPrimaryImage(product.images)?.url).toBe(
      cdnImage("products/p1/images/a1.png")
    );
    expect(product.videos[0].url).toBe(cdnVideo("products/p1/videos/v1.mp4"));
    expect(product.videos[0].thumbnailUrl).toBe(
      cdnPoster("products/p1/videos/v1.jpg")
    );
  });
});

describe("buildGalleryItems", () => {
  const image = (url: string, sortOrder: number) => ({ url, alt: url, sortOrder });
  const video = (url: string, sortOrder: number) => ({ url, sortOrder });

  it("puts every image before every video", () => {
    // Images lead so the gallery opens on the same picture the product card
    // shows; a customer who recognised a tile in the grid must land on that
    // tile, not on a clip.
    const items = buildGalleryItems(
      [image("a", 0), image("b", 1)],
      [video("v1", 0)]
    );
    expect(items.map((item) => (item.kind === "image" ? item.image.url : item.video.url))).toEqual([
      "a",
      "b",
      "v1",
    ]);
  });

  it("orders each list canonically, independent of array position", () => {
    const items = buildGalleryItems(
      [image("b", 1), image("a", 0)],
      [video("v2", 1), video("v1", 0)]
    );
    expect(items.map((item) => (item.kind === "image" ? item.image.url : item.video.url))).toEqual([
      "a",
      "b",
      "v1",
      "v2",
    ]);
  });

  it("is empty when the product has no media at all", () => {
    expect(buildGalleryItems([], [])).toEqual([]);
    expect(buildGalleryItems(undefined, undefined)).toEqual([]);
    expect(buildGalleryItems(null, null)).toEqual([]);
  });

  it("drops an entry with no loadable URL, so a dead tile is never offered", () => {
    // The adapters already drop these; this proves the gallery itself cannot be
    // handed something unopenable and render a tile that does nothing when
    // clicked.
    const items = buildGalleryItems(
      [{ url: "", alt: "gone", sortOrder: 0 }, image("a", 1)],
      [video("", 0), video("v1", 1)]
    );
    expect(
      items.map((item) => (item.kind === "image" ? item.image.url : item.video.url))
    ).toEqual(["a", "v1"]);
  });

  it("handles a product that has only clips", () => {
    // A video-only product is unusual but legal, and must still render rather
    // than falling into the no-media placeholder.
    const items = buildGalleryItems([], [video("v1", 0)]);
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe("video");
  });
});

describe("category thumbnails", () => {
  it("resolves a Cloudinary thumbnail and keeps the authored description", () => {
    const url = cdnImage("categories/c1/thumbnail/t1.png");
    expect(mapCategoryThumbnail({ url, alt: "Sarees on a rail" }, "Sarees")).toEqual({
      url,
      alt: "Sarees on a rail",
    });
  });

  it("omits the thumbnail entirely when the category has none", () => {
    // The key is absent rather than null, so the tile branches on presence and
    // renders its branded fallback.
    expect(mapCategoryThumbnail(undefined, "Sarees")).toBeUndefined();
    expect(mapCategoryResponse({ id: "c1", name: "Sarees", slug: "sarees" })).toEqual({
      id: "c1",
      name: "Sarees",
      slug: "sarees",
    });
  });

  it("treats an unusable thumbnail URL as no thumbnail", () => {
    // A broken tile is worse than a designed one.
    expect(mapCategoryThumbnail({ url: "javascript:alert(1)", alt: "x" }, "Sarees")).toBeUndefined();
    expect(
      mapCategoryResponse({
        id: "c1",
        name: "Sarees",
        slug: "sarees",
        thumbnail: { url: "//evil.example/a.png", alt: "x" },
      })
    ).not.toHaveProperty("thumbnail");
  });

  it("never produces an empty alt", () => {
    // A tile image with an empty alt is announced as an unlabelled image.
    const mapped = mapCategoryResponse({
      id: "c1",
      name: "Sarees",
      slug: "sarees",
      thumbnail: { url: cdnImage("categories/c1/thumbnail/t1.png"), alt: "   " },
    });
    expect(mapped.thumbnail?.alt).toBe("Sarees collection");
  });

  it("keeps a legacy root-relative thumbnail loading", () => {
    const mapped = mapCategoryResponse({
      id: "c1",
      name: "Sarees",
      slug: "sarees",
      thumbnail: { url: "/media/legacy-category.png", alt: "Old tile" },
    });
    expect(mapped.thumbnail?.url).toBe(`${API_ORIGIN}/media/legacy-category.png`);
  });
});
