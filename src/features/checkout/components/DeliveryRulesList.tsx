import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";
import type { PublicDeliveryRule } from "../services/deliveryService";

/**
 * The customer-facing "Delivery charges" reference list (Step 19A).
 *
 * Renders exactly what the backend publishes via the public delivery-rules
 * endpoint - no zone codes, priorities or internal ids. The list is
 * informative (which areas cost what); the live checkout preview, not this
 * list, decides the fee actually quoted for an address. That split keeps the
 * storefront honest: nothing here is ever sent back to the backend as money.
 *
 * Bangla support: when the shopkeeper configured a Bangla name or description,
 * it is shown first and the English variant goes muted underneath (and vice
 * versa when only English exists).
 */

function RuleName({ rule }: { rule: PublicDeliveryRule }) {
  const hasBn = Boolean(rule.nameBn);
  if (!hasBn) {
    return <span className="font-medium text-foreground">{rule.name}</span>;
  }
  return (
    <span className="space-x-1">
      <span className="font-medium text-foreground">{rule.nameBn}</span>
      <span className="text-xs font-normal text-muted-foreground">({rule.name})</span>
    </span>
  );
}

function RuleCoverage({ rule }: { rule: PublicDeliveryRule }) {
  const parts = [rule.area, rule.district, rule.country].filter(Boolean);
  return <span className="text-xs text-muted-foreground">{parts.join(" · ")}</span>;
}

function RuleDescription({ rule }: { rule: PublicDeliveryRule }) {
  const hasBn = Boolean(rule.descriptionBn);
  if (!hasBn) {
    if (!rule.description) return null;
    return <p className="text-xs text-muted-foreground">{rule.description}</p>;
  }
  return (
    <p className="text-xs text-muted-foreground">
      <span>{rule.descriptionBn}</span>
      {rule.description && (
        <span className="ml-1 text-muted-foreground/80">({rule.description})</span>
      )}
    </p>
  );
}

export function DeliveryRulesList({
  rules,
  className,
}: {
  rules: PublicDeliveryRule[];
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-md border border-border bg-card p-4", className)}
      aria-label="Delivery charges"
    >
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-foreground">Delivery charges</h4>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Delivery charges depend on the area you choose and are confirmed at
        checkout. Your area is matched against these rules automatically.
      </p>

      {rules.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Delivery charges are confirmed at checkout based on your delivery area.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rules.map((rule) => (
            <li
              key={`${rule.country}:${rule.district ?? ""}:${rule.area ?? ""}:${rule.name}:${rule.charge}`}
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-0.5">
                <RuleName rule={rule} />
                <RuleCoverage rule={rule} />
                <RuleDescription rule={rule} />
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  rule.charge === 0 ? "text-success" : "text-foreground"
                )}
              >
                {rule.charge === 0 ? "Free" : formatPrice(rule.charge)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}