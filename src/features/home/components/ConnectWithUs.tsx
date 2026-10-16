import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SocialConnect } from "./SocialConnect";
import { fetchStoreSocials, hasAnySocial } from "@/features/home/services/storeSocialsService";

/**
 * Standalone social-connect section on the home page.
 *
 * Server-rendered: the URLs are fetched alongside the page so the icons are
 * in the first paint, not hydrated late. When no channel is configured (or
 * the backend cannot be reached) the whole section hides itself rather than
 * showing dead links.
 */
export async function ConnectWithUs() {
  const socials = await fetchStoreSocials().catch(() => null);
  if (!socials || !hasAnySocial(socials)) return null;

  return (
    <section aria-labelledby="connect-heading" className="border-t border-border bg-card py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-label uppercase tracking-[0.18em] text-accent">
              Connect
            </p>
            <h2
              id="connect-heading"
              className="mt-2 font-display text-3xl tracking-tight text-foreground sm:text-4xl"
            >
              Find us on social
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Follow new drops, chat with us on Messenger, and be part of the
              Self Aura circle — one click away.
            </p>
            <SocialConnect socials={socials} size="lg" className="mt-8 justify-center" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
