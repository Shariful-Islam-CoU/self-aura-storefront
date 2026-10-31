import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductVideoFrame } from "@/components/product/ProductVideoFrame";
import { ProductGallery } from "@/features/products/components/ProductGallery";
import { CategoryCard } from "@/features/home/components/CategoryCard";
import { getPrimaryImage } from "@/features/products/lib/media";
import { mapProductImages, mapProductResponse } from "@/features/products/lib/catalogMappers";
import type { Category, Product, ProductImage, ProductResponse, ProductVideo } from "@/types";

/**
 * Component tests for the storefront product and category media.
 *
 * `next/image` is stubbed in tests/setup.tsx, so these assert OUR contract:
 * which media is picked, what alt text a customer (or a screen reader) is
 * given, that the box reserves its space, and that a missing or broken file
 * degrades to the styled fallback instead of a broken-image glyph.
 *
 * The Cloudinary cases use the real delivery-URL shape the backend produces,
 * because the thing most likely to break in a migration is a component that
 * still assumes the old root-relative `/media/<key>` path.
 */

// const API_ORIGIN = "http://localhost:5000";
// const API_ORIGIN = "https://self-aura-backend.onrender.com";
const API_ORIGIN = "https://api.self-aura.shop";
const CLOUD = "https://res.cloudinary.com/dzcqtjtiw";
const cdnImage = (path: string) =>
  `${CLOUD}/image/upload/f_auto,q_auto/c_limit,w_2000/v1/self-aura/${path}`;
const cdnVideo = (path: string) => `${CLOUD}/video/upload/f_mp4/v1/self-aura/${path}`;
const cdnPoster = (path: string) =>
  `${CLOUD}/video/upload/so_1,f_jpg/v1/self-aura/${path}`;

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Emerald Halo Ring",
    slug: "emerald-halo-ring",
    sku: "SA-RNG-001",
    category: { id: "c1", name: "Fine Jewelry" },
    images: mapProductImages(
      [
        { url: "/media/front.png", alt: "Emerald Halo Ring, front view", sortOrder: 0 },
        { url: "/media/side.png", alt: "Emerald Halo Ring, side view", sortOrder: 1 },
      ],
      "Emerald Halo Ring"
    ),
    videos: [],
    sellingPrice: 4200,
    stock: 5,
    lowStock: false,
    ...overrides,
  };
}

const cdnClip = (overrides: Partial<ProductVideo> = {}): ProductVideo => ({
  url: cdnVideo("products/p1/videos/v1.mp4"),
  thumbnailUrl: cdnPoster("products/p1/videos/v1.jpg"),
  sortOrder: 0,
  alt: "Ring rotating on a stand",
  ...overrides,
});

const renderCard = (product: Product, props: { demo?: boolean } = {}) =>
  render(
    <ul>
      <ProductCard product={product} {...props} />
    </ul>
  );

describe("ProductCard", () => {
  it("shows the primary image (sortOrder 0), not the first array entry", () => {
    // Deliberately out of order: the card must follow the canonical order, not
    // the wire order, or the "primary" image would be a coin flip.
    const product = makeProduct({
      images: [
        { url: `${API_ORIGIN}/media/side.png`, alt: "side", sortOrder: 1 },
        { url: `${API_ORIGIN}/media/front.png`, alt: "front", sortOrder: 0 },
      ],
    });
    renderCard(product);

    const image = screen.getByTestId("next-image");
    expect(image).toHaveProperty("src", `${API_ORIGIN}/media/front.png`);
    expect(getPrimaryImage(product.images)?.url).toBe(`${API_ORIGIN}/media/front.png`);
  });

  it("shows the Cloudinary delivery URL untouched", () => {
    // A card that rewrote this against the API origin would 404 for every
    // product uploaded after the migration.
    const url = cdnImage("products/p1/images/aaa-1a2b3c.png");
    renderCard(
      makeProduct({ images: [{ url, alt: "Front view", sortOrder: 0 }] })
    );
    expect(screen.getByTestId("next-image")).toHaveProperty("src", url);
  });

  it("passes a responsive `sizes` hint to next/image so it is not oversized", () => {
    renderCard(makeProduct());
    const image = screen.getByTestId("next-image");
    expect(image.getAttribute("data-sizes")).toBe(
      "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
    );
  });

  it("uses the authored alt text", () => {
    renderCard(makeProduct());
    expect(screen.getByTestId("next-image")).toHaveProperty(
      "alt",
      "Emerald Halo Ring, front view"
    );
  });

  it("never leaves the alt empty, because an unlabelled image is worse than a generic one", () => {
    renderCard(
      makeProduct({ images: [{ url: `${API_ORIGIN}/media/a.png`, alt: "  ", sortOrder: 0 }] })
    );
    expect(screen.getByTestId("next-image").getAttribute("alt")).toBe(
      "Emerald Halo Ring"
    );
  });

  it("reserves a 4/5 box so the grid never shifts when the photo loads", () => {
    renderCard(makeProduct());
    // The frame is the img's direct parent and carries the ratio, so the box is
    // the right size before a single byte of the photo arrives.
    const frame = screen.getByTestId("next-image").parentElement;
    expect(frame?.className).toContain("aspect-[4/5]");
  });

  it("renders the styled fallback when the product has no image at all", () => {
    renderCard(makeProduct({ images: [] }));
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
    expect(screen.getByText("Image coming soon")).toBeTruthy();
  });

  it("swaps to the styled fallback when the image fails to load", () => {
    renderCard(makeProduct());
    expect(screen.getByTestId("next-image")).toBeTruthy();

    fireEvent.error(screen.getByTestId("next-image"));

    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
  });

  it("keeps the product link and wishlist control as separate tab stops", () => {
    renderCard(makeProduct());
    const link = screen.getByLabelText("View Emerald Halo Ring details");
    expect(link.getAttribute("href")).toBe("/products/emerald-halo-ring");
    // The wishlist button must not be nested inside the product anchor, or
    // tapping it would also navigate.
    expect(link.querySelector('[data-testid="wishlist-toggle"]')).toBeNull();
    expect(screen.getByTestId("wishlist-toggle")).toBeTruthy();
  });

  it("marks a demo card so placeholder imagery is never read as real", () => {
    // Demo products carry local placeholder art, so the card must be visibly
    // badged: a customer must never mistake a layout sample for a real product.
    renderCard(makeProduct(), { demo: true });
    expect(screen.getByText("Preview")).toBeTruthy();
  });

  it("says so explicitly when a demo card has no image at all", () => {
    renderCard(makeProduct({ images: [] }), { demo: true });
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
    expect(screen.getByText("Sample imagery")).toBeTruthy();
  });

  describe("videos", () => {
    it("never mounts a <video> element, so nothing can autoplay in the grid", () => {
      // A grid of a dozen autoplaying clips is unusable on a phone: they fight
      // for bandwidth, they eat mobile data, and the sound is unasked-for.
      const { container } = renderCard(
        makeProduct({ videos: [cdnClip(), cdnClip({ url: cdnVideo("v2.mp4"), sortOrder: 1 })] })
      );
      expect(container.querySelectorAll("video")).toHaveLength(0);
    });

    it("badges the clip count so the customer knows a clip exists", () => {
      renderCard(makeProduct({ videos: [cdnClip(), cdnClip({ url: cdnVideo("v2.mp4"), sortOrder: 1 })] }));
      const badge = screen.getByText("2");
      expect(badge).toBeTruthy();
      // The badge is decorative; the link's accessible name already carries
      // the product, so a screen reader is not told "2" out of context.
      expect(badge.closest("[aria-hidden='true']")).toBeTruthy();
    });

    it("shows no badge for a product with no clips", () => {
      const { container } = renderCard(makeProduct({ videos: [] }));
      expect(container.querySelector(".lucide-film")).toBeNull();
    });

    it("does not badge a demo card, whose clips are not real", () => {
      const { container } = renderCard(makeProduct({ videos: [cdnClip()] }), { demo: true });
      expect(container.querySelector(".lucide-film")).toBeNull();
    });

    it("still uses the primary IMAGE, never a poster frame, as the card tile", () => {
      // A poster is not the product picture. A card that picked one would show
      // a clip's first frame in the grid while the detail page opened on the
      // photo.
      const { container } = renderCard(
        makeProduct({
          images: [{ url: cdnImage("products/p1/images/a1.png"), alt: "Front", sortOrder: 0 }],
          videos: [cdnClip()],
        })
      );
      const image = within(container as HTMLElement).getByTestId("next-image");
      expect(image.getAttribute("src")).toBe(cdnImage("products/p1/images/a1.png"));
      expect(image.getAttribute("src")).not.toContain("so_1");
    });
  });
});

describe("ProductVideoFrame", () => {
  it("renders no <video> element until the customer presses play", () => {
    // The strongest form of the no-autoplay guarantee: the media element does
    // not exist at all until it is asked for.
    const { container } = render(
      <ProductVideoFrame video={cdnClip()} name="Emerald Halo Ring" sizes="50vw" aspectRatio="4 / 5" />
    );
    expect(container.querySelectorAll("video")).toHaveLength(0);
    // The poster is what stands in, and it is an ordinary optimised image.
    expect(screen.getByTestId("next-image").getAttribute("src")).toBe(
      cdnPoster("products/p1/videos/v1.jpg")
    );
  });

  it("mounts a muted-by-default-free player only on an explicit press", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductVideoFrame video={cdnClip()} name="Emerald Halo Ring" sizes="50vw" aspectRatio="4 / 5" />
    );

    await user.click(screen.getByRole("button", { name: /Play Ring rotating on a stand/ }));

    const player = container.querySelector("video");
    expect(player).toBeTruthy();
    // `autoplay` is the attribute to assert on: an autoplaying shop is the exact
    // failure this component exists to prevent.
    expect(player?.hasAttribute("autoplay")).toBe(false);
    expect(player?.getAttribute("controls")).not.toBeNull();
    expect(player?.getAttribute("preload")).toBe("metadata");
  });

  it("labels the play control with the clip's description", () => {
    render(
      <ProductVideoFrame video={cdnClip()} name="Emerald Halo Ring" sizes="50vw" aspectRatio="4 / 5" />
    );
    expect(screen.getByRole("button", { name: "Play Ring rotating on a stand" })).toBeTruthy();
  });

  it("derives a description when the clip has none, rather than an empty label", () => {
    render(
      <ProductVideoFrame
        video={cdnClip({ alt: "" })}
        name="Emerald Halo Ring"
        sizes="50vw"
        aspectRatio="4 / 5"
      />
    );
    expect(
      screen.getByRole("button", { name: "Play Emerald Halo Ring product video" })
    ).toBeTruthy();
  });

  it("still offers the clip when there is no poster, over the styled fallback", () => {
    // A video stored before posters existed must remain watchable, not become
    // a black box with no way in.
    render(
      <ProductVideoFrame
        video={cdnClip({ thumbnailUrl: undefined })}
        name="Emerald Halo Ring"
        sizes="50vw"
        aspectRatio="4 / 5"
      />
    );
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Play/ })).toBeTruthy();
  });

  it("reserves its box so the layout does not jump when the player mounts", () => {
    const { container } = render(
      <ProductVideoFrame video={cdnClip()} name="Emerald Halo Ring" sizes="50vw" aspectRatio="4 / 5" />
    );
    const frame = container.firstElementChild as HTMLElement;
    expect(frame.style.aspectRatio).toBe("4 / 5");
  });
});

describe("ProductGallery", () => {
  const three: ProductImage[] = [
    { url: `${API_ORIGIN}/media/one.png`, alt: "one", sortOrder: 0 },
    { url: `${API_ORIGIN}/media/two.png`, alt: "two", sortOrder: 1 },
    { url: `${API_ORIGIN}/media/three.png`, alt: "three", sortOrder: 2 },
  ];

  /** The main view is the last rendered image; thumbnails come first. */
  const mainSrc = () => {
    const images = screen.getAllByTestId("next-image");
    return images[images.length - 1].getAttribute("src");
  };

  it("opens on the primary image", () => {
    render(<ProductGallery images={three} name="Ring" />);
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/one.png`);
  });

  it("shows a thumbnail per image and marks the active one", () => {
    render(<ProductGallery images={three} name="Ring" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    // Roving tabindex: one tab stop, not three.
    expect(tabs.filter((tab) => tab.getAttribute("tabindex") === "0")).toHaveLength(1);
  });

  it("swaps the main image when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);

    await user.click(screen.getAllByRole("tab")[1]);

    expect(mainSrc()).toBe(`${API_ORIGIN}/media/two.png`);
    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe("true");
  });

  it("advances with the next/prev buttons and wraps around", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);

    await user.click(screen.getByLabelText("Next image"));
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/two.png`);

    await user.click(screen.getByLabelText("Next image"));
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/three.png`);

    // Next on the last image returns to the first: a customer can never get
    // stuck at the end of the gallery.
    await user.click(screen.getByLabelText("Next image"));
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/one.png`);

    // ...and prev on the first wraps to the last.
    await user.click(screen.getByLabelText("Previous image"));
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/three.png`);
  });

  it("supports arrow, Home and End keys from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);
    screen.getAllByRole("tab")[0].focus();

    await user.keyboard("{ArrowRight}");
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/two.png`);

    await user.keyboard("{End}");
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/three.png`);

    await user.keyboard("{Home}");
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/one.png`);
  });

  it("moves focus with the selection when arrowing through thumbnails", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();

    await user.keyboard("{ArrowRight}");

    // Focus must follow, or a keyboard user ends up focused on a tab that is
    // no longer selected.
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });

  it("omits the thumbnail rail and arrows for a single image", () => {
    render(<ProductGallery images={[three[0]]} name="Ring" />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByLabelText("Next image")).toBeNull();
    expect(screen.queryByLabelText("Previous image")).toBeNull();
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/one.png`);
  });

  it("renders the styled fallback, not a broken image, when there is nothing", () => {
    render(<ProductGallery images={[]} name="Ring" />);
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
  });

  it("keeps the thumbnails usable when the main image fails to load", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);

    // Simulate the main image 404ing.
    const images = screen.getAllByTestId("next-image");
    fireEvent.error(images[images.length - 1]);

    expect(screen.getAllByTestId("product-image-fallback").length).toBeGreaterThan(0);
    // Navigation still works, so a customer is not stranded.
    await user.click(screen.getByLabelText("Next image"));
    expect(screen.getAllByTestId("next-image").length).toBeGreaterThan(0);
  });

  it("does not point past the end of the list if the images shrink", () => {
    const { rerender } = render(<ProductGallery images={three} name="Ring" />);
    rerender(<ProductGallery images={[three[0]]} name="Ring" />);
    expect(mainSrc()).toBe(`${API_ORIGIN}/media/one.png`);
  });

  it("gives each thumbnail an accessible position label", () => {
    render(<ProductGallery images={three} name="Ring" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0].getAttribute("aria-label")).toBe("View image 1 of 3");
    expect(tabs[2].getAttribute("aria-label")).toBe("View image 3 of 3");
  });

  it("loads the first view eagerly and later views lazily", async () => {
    // The primary image is the LCP element; everything else is fetched only
    // when the customer asks for it.
    const user = userEvent.setup();
    render(<ProductGallery images={three} name="Ring" />);
    expect(
      screen.getAllByTestId("next-image").at(-1)?.getAttribute("data-priority")
    ).toBe("true");

    await user.click(screen.getAllByRole("tab")[2]);
    expect(
      screen.getAllByTestId("next-image").at(-1)?.hasAttribute("data-priority")
    ).toBe(false);
  });

  describe("videos", () => {
    const images = [
      { url: cdnImage("products/p1/images/a1.png"), alt: "Front", sortOrder: 0 },
      { url: cdnImage("products/p1/images/a2.png"), alt: "Back", sortOrder: 1 },
    ];

    it("puts clips after the photos and opens on the primary image", () => {
      render(
        <ProductGallery
          images={images}
          videos={[cdnClip()]}
          name="Emerald Halo Ring"
        />
      );
      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3);
      // Images first: the gallery must agree with the card.
      expect(tabs[0].getAttribute("aria-label")).toBe("View image 1 of 3");
      expect(tabs[2].getAttribute("aria-label")).toBe("View video 3 of 3");
      expect(mainSrc()).toBe(cdnImage("products/p1/images/a1.png"));
    });

    it("distinguishes clips from photos in the accessible labels", () => {
      // "View item 3 of 7" is useless to a screen-reader user, who cannot see
      // which tiles carry a play badge.
      render(
        <ProductGallery images={images} videos={[cdnClip()]} name="Emerald Halo Ring" />
      );
      const labels = screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-label"));
      expect(labels).toEqual([
        "View image 1 of 3",
        "View image 2 of 3",
        "View video 3 of 3",
      ]);
    });

    it("paints the clip's poster frame in the thumbnail rail, not the video", () => {
      // A 64px tile must cost a still-image request, never a multi-megabyte MP4.
      const { container } = render(
        <ProductGallery images={images} videos={[cdnClip()]} name="Emerald Halo Ring" />
      );
      expect(container.querySelectorAll("video")).toHaveLength(0);
      const thumbs = screen.getAllByRole("tab");
      expect(within(thumbs[2]).getByTestId("next-image").getAttribute("src")).toBe(
        cdnPoster("products/p1/videos/v1.jpg")
      );
    });

    it("shows the poster with a play affordance when the clip is selected", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} videos={[cdnClip()]} name="Emerald Halo Ring" />
      );

      await user.click(screen.getAllByRole("tab")[2]);

      // The main view is the poster, plus a labelled play control - still no
      // <video> element and therefore still nothing that can autoplay.
      expect(mainSrc()).toBe(cdnPoster("products/p1/videos/v1.jpg"));
      expect(screen.getByRole("button", { name: /Play Ring rotating on a stand/ })).toBeTruthy();
    });

    it("pages from a photo onto a clip and back, wrapping the whole sequence", async () => {
      const user = userEvent.setup();
      render(
        <ProductGallery images={images} videos={[cdnClip()]} name="Emerald Halo Ring" />
      );

      await user.click(screen.getByLabelText("Next image"));
      expect(mainSrc()).toBe(cdnImage("products/p1/images/a2.png"));

      await user.click(screen.getByLabelText("Next image"));
      expect(mainSrc()).toBe(cdnPoster("products/p1/videos/v1.jpg"));

      // ...and past the clip wraps back to the first photo.
      await user.click(screen.getByLabelText("Next image"));
      expect(mainSrc()).toBe(cdnImage("products/p1/images/a1.png"));
    });

    it("keeps the position counter honest now that clips are in the sequence", () => {
      render(
        <ProductGallery images={images} videos={[cdnClip()]} name="Emerald Halo Ring" />
      );
      expect(screen.getByText("1 / 3")).toBeTruthy();
    });

    it("renders a product with only a clip, with no photo fallback in the way", () => {
      render(<ProductGallery images={[]} videos={[cdnClip()]} name="Ring" />);
      // A single item has nothing to navigate, so the rail is omitted and the
      // clip is the whole gallery.
      expect(screen.queryAllByRole("tab")).toHaveLength(0);
      expect(mainSrc()).toBe(cdnPoster("products/p1/videos/v1.jpg"));
    });

    it("drops an unplayable clip rather than offering a dead tile", () => {
      // The adapter already filters these; this proves the gallery renders a
      // working sequence for whatever it is handed.
      render(
        <ProductGallery
          images={images}
          videos={[{ url: "", sortOrder: 0, thumbnailUrl: cdnPoster("x.jpg") }]}
          name="Ring"
        />
      );
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });
  });
});

describe("CategoryCard", () => {
  const base = { id: "c1", name: "Fine Jewelry", slug: "fine-jewelry" };

  it("shows the uploaded thumbnail from Cloudinary", () => {
    const url = cdnImage("categories/c1/thumbnail/t1.png");
    const category: Category = { ...base, thumbnail: { url, alt: "Rings on a rail" } };
    render(
      <ul>
        <CategoryCard category={category} />
      </ul>
    );
    expect(screen.getByTestId("next-image").getAttribute("src")).toBe(url);
  });

  it("describes the tile with the uploaded alt text", () => {
    const category: Category = {
      ...base,
      thumbnail: { url: cdnImage("categories/c1/t1.png"), alt: "Rings on a rail" },
    };
    render(
      <ul>
        <CategoryCard category={category} />
      </ul>
    );
    expect(screen.getByTestId("next-image").getAttribute("alt")).toBe("Rings on a rail");
  });

  it("falls back to a category-derived description when no alt was stored", () => {
    // An empty `alt` would be announced as an unlabelled image.
    const category: Category = {
      ...base,
      thumbnail: { url: cdnImage("categories/c1/t1.png"), alt: "" },
    };
    render(
      <ul>
        <CategoryCard category={category} />
      </ul>
    );
    expect(screen.getByTestId("next-image").getAttribute("alt")).toBe(
      "Fine Jewelry collection"
    );
  });

  it("shows the branded monogram tile when the category has no thumbnail", () => {
    render(
      <ul>
        <CategoryCard category={base} />
      </ul>
    );
    // No broken-image glyph, and no image request at all for the artwork.
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
    // The monogram is the first letter of the first word.
    expect(screen.getByText("F")).toBeTruthy();
  });

  it("uses the first letter of the first word, not the start of a compound name", () => {
    render(
      <ul>
        <CategoryCard category={{ ...base, name: "Home Linens" }} />
      </ul>
    );
    expect(screen.getByText("H")).toBeTruthy();
  });

  it("swaps to the branded tile when the thumbnail fails to load", () => {
    const category: Category = {
      ...base,
      thumbnail: { url: cdnImage("categories/c1/t1.png"), alt: "Rings" },
    };
    render(
      <ul>
        <CategoryCard category={category} />
      </ul>
    );
    fireEvent.error(screen.getByTestId("next-image"));
    expect(screen.queryByTestId("next-image")).toBeNull();
    expect(screen.getByTestId("product-image-fallback")).toBeTruthy();
  });

  it("keeps the whole card as a single link, named for the category", () => {
    render(
      <ul>
        <CategoryCard category={base} />
      </ul>
    );
    const link = screen.getByLabelText("Explore Fine Jewelry");
    expect(link.getAttribute("href")).toBe("/categories/fine-jewelry");
    // The scrim and monogram are decorative; a screen reader should hear the
    // category name once, not three times.
    expect(link.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("reserves a 4/5 box so the home grid never shifts", () => {
    render(
      <ul>
        <CategoryCard category={base} />
      </ul>
    );
    const box = screen.getByTestId("product-image-fallback").closest(
      "[style]"
    ) as HTMLElement;
    expect(box.style.aspectRatio).toBe("4 / 5");
  });
});

describe("mapProductImages + ProductCard together", () => {
  it("shows a real uploaded image even though the stored URL is root-relative", () => {
    // This is the end-to-end proof that the adapter + card agree: the legacy
    // wire format is `/media/...` and the card must request the API origin.
    const product = makeProduct({
      images: mapProductImages([{ url: "/media/9f2c-abcd.png", alt: "Front", sortOrder: 0 }], "Ring"),
    });
    renderCard(product);
    expect(screen.getByTestId("next-image")).toHaveProperty(
      "src",
      `${API_ORIGIN}/media/9f2c-abcd.png`
    );
  });

  it("carries a Cloudinary product end to end, image and clip both", () => {
    // Adapter + card + gallery all reading the same payload: the image tile, the
    // gallery's opening view and the clip poster are all real Cloudinary URLs,
    // none of them rewritten.
    const wire: ProductResponse = {
      id: "p1",
      name: "Emerald Halo Ring",
      slug: "emerald-halo-ring",
      sku: "SA-RNG-001",
      category: { id: "c1", name: "Fine Jewelry" },
      images: [
        { url: cdnImage("products/p1/images/a1.png"), alt: "Front", sortOrder: 0 },
        { url: cdnImage("products/p1/images/a2.png"), alt: "Back", sortOrder: 1 },
      ],
      videos: [
        {
          url: cdnVideo("products/p1/videos/v1.mp4"),
          thumbnailUrl: cdnPoster("products/p1/videos/v1.jpg"),
          sortOrder: 0,
          alt: "Ring rotating",
        },
      ],
      sellingPrice: 4200,
      stock: 5,
      lowStock: false,
    };
    const product = mapProductResponse(wire);

    const { unmount } = renderCard(product);
    expect(screen.getByTestId("next-image").getAttribute("src")).toBe(
      cdnImage("products/p1/images/a1.png")
    );
    unmount();

    render(<ProductGallery images={product.images} videos={product.videos} name={product.name} />);
    const images = screen.getAllByTestId("next-image");
    // Thumbnails first (a1, a2, poster), main view last (a1 again).
    expect(images.at(-1)?.getAttribute("src")).toBe(cdnImage("products/p1/images/a1.png"));
    expect(screen.getAllByRole("tab")[2].querySelector("img")?.getAttribute("src")).toBe(
      cdnPoster("products/p1/videos/v1.jpg")
    );
  });
});
