import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ProductImageFallbackProps {
  /** Optional line under the icon, e.g. "Image coming soon". */
  label?: string;
  className?: string;
}

/**
 * Styled placeholder for a product image that is missing or failed to load.
 *
 * A broken image must never reach a customer as a browser broken-image glyph or
 * an empty hole in the grid: this renders the Self Aura neutral surface (muted
 * ground, hairline border, dashed inner frame) with a quiet icon, so a
 * catalogue that is still being filled in looks intentional. Every colour comes
 * from a theme token, so it follows light/dark/system with no extra work.
 *
 * Purely decorative - it is `aria-hidden`, because the surrounding card, gallery
 * or row already names the product for assistive technology.
 */
export function ProductImageFallback({
  label = "Image coming soon",
  className,
}: ProductImageFallbackProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="product-image-fallback"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2",
        "bg-muted text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          "border border-dashed border-muted-foreground/35 bg-background/60"
        )}
      >
        <ImageOff className="h-4 w-4 opacity-60" />
      </span>
      <span className="text-[11px] font-label uppercase tracking-[0.16em] opacity-80">
        {label}
      </span>
    </div>
  );
}
