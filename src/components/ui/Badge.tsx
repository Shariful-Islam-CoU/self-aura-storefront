import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "accent"
    | "success"
    | "warning"
    | "destructive"
    | "info";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "secondary", ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-muted text-foreground",
      outline: "border border-border text-foreground bg-background",
      accent: "bg-accent/10 text-accent ring-1 ring-inset ring-accent/25",
      success: "bg-success/10 text-success ring-1 ring-inset ring-success/25",
      warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
      destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25",
      info: "bg-info/10 text-info ring-1 ring-inset ring-info/25",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-label whitespace-nowrap",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };