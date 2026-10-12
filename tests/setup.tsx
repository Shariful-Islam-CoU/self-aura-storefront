import "@testing-library/dom";
import type { ComponentProps } from "react";

/**
 * Test environment shims for the storefront component tests.
 *
 * `next/image` is stubbed rather than rendered for real: the Next Image
 * component's job is to build an optimized `/_next/image` URL, and the tests
 * here are about OUR behaviour (which image is chosen, what the alt text is,
 * that a broken file degrades to a styled fallback). Stubbing it keeps the
 * tests deterministic and lets a test fire `onError` to simulate a 404 without
 * a network request. The handlers are kept wired up for the same reason.
 */
type MockImageProps = {
  src: string;
  alt: string;
  onError?: () => void;
  onLoad?: () => void;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  className?: string;
};

const MockImage = ({
  src,
  alt,
  onError,
  onLoad,
  priority,
  sizes,
  className,
}: MockImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element -- deliberate stub, see above.
  <img
    data-testid="next-image"
    data-src={src}
    data-sizes={sizes}
    data-priority={priority ? "true" : undefined}
    src={src}
    alt={alt}
    className={className}
    onLoad={onLoad}
    onError={onError}
  />
);

vi.mock("next/image", () => ({
  default: (props: MockImageProps) => <MockImage {...props} />,
  getImageProps: (props: Record<string, unknown>) => ({ props }),
}));

// next/link renders an anchor; the real one needs a router context.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: ComponentProps<"a">["children"];
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// next/navigation useRouter needs a mounted router in a real app. For component
// tests we provide a minimal, harmless stub so components using useRouter don't
// throw.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// The wishlist toggle needs a provider the card tests do not set up; the card
// tests are about the card, so render a harmless button in its place.
vi.mock("@/features/wishlist/components/WishlistToggle", () => ({
  WishlistToggle: ({ productId }: { productId: string }) => (
    <button type="button" data-testid="wishlist-toggle" data-product-id={productId} />
  ),
}));
