import { Info, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import type { PublicDeliveryRule } from "../services/deliveryService";

/**
 * Interactive delivery rule selection for checkout.
 *
 * Renders radio buttons for each active delivery rule. The customer selects
 * one rule, and the selection is passed to the backend for pricing.
 * Rules are sorted by price descending (highest first) - the default.
 */
export function DeliveryRulesList({
  rules,
  selectedRuleId,
  onSelectRule,
  className,
}: {
  rules: PublicDeliveryRule[];
  selectedRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-md border border-border bg-card p-4", className)}
      aria-label="Delivery options"
      role="radiogroup"
    >
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-foreground">Delivery option</h4>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Select a delivery option. The highest price is selected by default. Admin can
        correct wrong selections on the order page.
      </p>

      {rules.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No delivery options available. Please contact us for manual arrangement.
        </p>
      ) : (
        <ul className="pt-3 divide-y divide-border">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                "flex items-start justify-between gap-3 py-2.5 first:pt-3 last:pb-0 cursor-pointer transition-colors rounded-md px-2 -mx-2",
                selectedRuleId === rule.id ? "bg-accent/5" : "hover:bg-muted/30"
              )}
              onClick={() => onSelectRule(rule.id)}
            >
              <input
                type="radio"
                name="deliveryRule"
                value={rule.id}
                checked={selectedRuleId === rule.id}
                onChange={() => onSelectRule(rule.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={rule.name}
              />
              <div className="min-w-0 space-y-0.5 flex-1">
                <span className="font-medium text-foreground pr-2">{rule.name}</span>
                <span className="text-xs text-muted-foreground">
                  {rule.estimatedMinDays}–{rule.estimatedMaxDays} days
                </span>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  rule.price === 0 ? "text-success" : "text-foreground"
                )}
              >
                {rule.price === 0 ? "FREE" : formatPrice(rule.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}