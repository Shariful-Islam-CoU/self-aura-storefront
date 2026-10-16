"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SocialConnectLive } from "./SocialConnect";

/**
 * Newsletter / social CTA.
 *
 * The newsletter backend is NOT implemented. The form is visually prepared but
 * never pretends to subscribe: submitting shows an honest "coming soon"
 * message instead of a fake success state.
 */
export function NewsletterCta() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitted");
  }

  return (
    <section id="newsletter" aria-labelledby="newsletter-heading" className="scroll-mt-24 border-t border-border bg-card py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">Newsletter</p>
            <h2 id="newsletter-heading" className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl">
              Stay in the Self Aura
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Discover new arrivals, collections and updates — in your inbox.
            </p>

            <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                name="email"
                aria-label="Email address"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-12 w-full"
                aria-describedby={status === "submitted" ? "newsletter-status" : undefined}
              />
              <Button type="submit" size="lg" className="shrink-0">
                Subscribe
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <p id="newsletter-status" aria-live="polite" className="mt-4 min-h-5 text-sm text-muted-foreground">
              {status === "submitted" ? "Thanks for the interest — newsletter signup will open soon." : ""}
            </p>

            <div className="mt-8">
              <SocialConnectLive label="Follow us" />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}