import { Banknote, PackageSearch, ShieldCheck, Headphones } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Compact service/trust strip.
 *
 * IMPORTANT: services are treated as PREPARED PLACEHOLDERS, not live promises.
 * "Cash on Delivery" carries a "coming soon" note; the others are phrased as
 * intended-experience benefits, not claims that the feature is live. Remove or
 * rephrase any item here once the real service scope is confirmed - this is a
 * single array, so editing is trivial.
 */
const services = [
  {
    icon: Banknote,
    title: "Cash on Delivery",
    caption: "Coming soon",
    soon: true,
  },
  {
    icon: PackageSearch,
    title: "Easy Order Tracking",
    caption: "Follow your order at a glance",
    soon: false,
  },
  {
    icon: ShieldCheck,
    title: "Secure Checkout",
    caption: "A calm, protected checkout",
    soon: false,
  },
  {
    icon: Headphones,
    title: "Customer Support",
    caption: "Help when you need it",
    soon: false,
  },
];

export function TrustHighlights() {
  return (
    <section aria-label="Service highlights" className="py-12 sm:py-16">
      <Container>
        <Reveal>
          <ul
            role="list"
            className="grid grid-cols-2 gap-x-6 gap-y-8 rounded-lg border border-border bg-card p-6 sm:p-8 lg:grid-cols-4"
          >
            {services.map((service) => (
              <li key={service.title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <service.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {service.title}
                    {service.soon && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-label uppercase tracking-wide text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{service.caption}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}