import Link from "next/link";
import { Container } from "./Container";
import { BrandMark } from "./BrandMark";
import {
  footerShopLinks,
  footerCareLinks,
  footerAboutLinks,
  footerSocialLinks,
  footerLegalLinks,
} from "@/constants/navigation";

function FooterLinkColumn({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={heading} className="space-y-3">
      <h3 className="text-xs font-label uppercase tracking-[0.14em] text-muted-foreground">{heading}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-foreground/80 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-2">
            <Link
              href="/"
              className="flex w-fit items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label="Self Aura - home"
            >
              <BrandMark />
              <span className="font-display text-xl font-medium tracking-wide text-foreground">
                Self&nbsp;Aura
              </span>
              <span aria-hidden="true" className="mt-0.5 inline-block h-2 w-2 rotate-45 rounded-[2px] bg-accent" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A hand-curated edit of jewelry and lifestyle pieces — designed to
              be felt as much as seen.
            </p>
          </div>

          <FooterLinkColumn heading="Shop" links={footerShopLinks} />
          <FooterLinkColumn heading="Customer Care" links={footerCareLinks} />
          <FooterLinkColumn heading="About" links={footerAboutLinks} />

          {/* Social - placeholder channels until real profiles exist */}
          <FooterLinkColumn heading="Social" links={footerSocialLinks} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Legal placeholders - link to real policy pages when published */}
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerLegalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Self Aura. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}