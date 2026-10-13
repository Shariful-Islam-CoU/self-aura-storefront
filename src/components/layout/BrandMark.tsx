import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
}

/**
 * Theme-aware brand mark. The light artwork shows by default and the dark
 * artwork takes over under `dark:` - Tailwind v4 resolves that variant from
 * `prefers-color-scheme`, which is the same signal the root layout's theme
 * script uses to toggle `.dark`, so the two always agree with zero JS and
 * no hydration mismatch. Both images share layout size so swapping never
 * shifts surrounding content.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={cn("relative inline-block h-12 w-12 shrink-0", className)} aria-hidden="true">
      <img
        src="/images/logo_light.png"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full rounded-lg object-cover dark:hidden"
      />
      <img
        src="/images/logo_dark.png"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 hidden h-full w-full rounded-lg object-cover dark:block"
      />
    </span>
  );
}
