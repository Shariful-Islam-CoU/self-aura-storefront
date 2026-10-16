import { Sparkles, MousePointerClick, Headphones, Gem } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Brand value cards. Generic, truthful service-oriented copy only - no
 * unsupported claims about products, materials or availability.
 */
const values = [
  {
    icon: Sparkles,
    title: "Curated Collections",
    description: "Explore thoughtfully selected styles in one place.",
  },
  {
    icon: MousePointerClick,
    title: "Easy Ordering",
    description: "Simple shopping from browsing to checkout.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Get help when you need it.",
  },
  {
    icon: Gem,
    title: "Quality-Focused Selection",
    description: "Every piece is chosen with care.",
  },
];

export function WhySelfAura() {
  return (
    <section aria-labelledby="why-heading" className="border-y border-border bg-card py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">Why Self Aura</p>
            <h2 id="why-heading" className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              Shopping that feels considered
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A calm, considered experience from the first browse to your door.
            </p>
          </div>
        </Reveal>

        <ul role="list" className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <li key={value.title} className="h-full">
              <Reveal delay={index * 70} className="h-full">
                <div className="h-full rounded-lg border border-border bg-background p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <value.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg text-foreground">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}