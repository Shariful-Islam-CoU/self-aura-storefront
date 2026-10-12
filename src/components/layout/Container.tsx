import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Consistent page-width wrapper. Spacious and centered - the storefront uses
 * generous gutters with a single wide column rather than the dense,
 * data-heavy layout of the Management App.
 */
const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
);
Container.displayName = "Container";

export { Container };