"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import {
  EMPTY_STORE_SOCIALS,
  fetchStoreSocialsCached,
  hasAnySocial,
  type StoreSocials,
} from "@/features/home/services/storeSocialsService";

export type SocialChannel = "facebook" | "instagram" | "messenger";

const CHANNEL_META: Record<
  SocialChannel,
  { label: string; key: keyof StoreSocials }
> = {
  facebook: { label: "Facebook", key: "facebook" },
  instagram: { label: "Instagram", key: "instagram" },
  messenger: { label: "Messenger", key: "messenger" },
};

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M13 7.5 9.5 12H12l-1 4 3.5-4.5H12l1-4z" />
    </svg>
  );
}

const CHANNEL_ICONS: Record<SocialChannel, (props: { className?: string }) => React.ReactNode> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  messenger: MessengerIcon,
};

const CHANNEL_ORDER: SocialChannel[] = ["facebook", "instagram", "messenger"];

interface SocialConnectProps {
  socials: StoreSocials;
  /** Visual size of the icon buttons. */
  size?: "md" | "lg";
  className?: string;
}

/**
 * One-click social connect buttons. Only channels with a real URL render -
 * an unset channel is hidden, never a dead link. Links open a new tab with
 * `noopener` so the shop stays open.
 */
export function SocialConnect({ socials, size = "md", className }: SocialConnectProps) {
  const channels = CHANNEL_ORDER.filter((channel) => socials[CHANNEL_META[channel].key]);
  if (channels.length === 0) return null;

  const buttonSize = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const iconSize = size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel];
        return (
          <a
            key={channel}
            href={socials[CHANNEL_META[channel].key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Connect with Self Aura on ${CHANNEL_META[channel].label}`}
            className={cn(
              "inline-flex items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
              "hover:border-accent/60 hover:text-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              buttonSize
            )}
          >
            <Icon className={iconSize} />
          </a>
        );
      })}
    </div>
  );
}

/**
 * Footer social column: heading + icons, or nothing at all when no channel
 * is configured - so the footer never shows an empty "Social" heading.
 */
export function FooterSocialColumn() {
  const [socials, setSocials] = useState<StoreSocials | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStoreSocialsCached()
      .then((data) => {
        if (!cancelled) setSocials(data);
      })
      .catch(() => {
        if (!cancelled) setSocials(EMPTY_STORE_SOCIALS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!socials || !hasAnySocial(socials)) return null;

  return (
    <nav aria-label="Social">
      <h3 className="text-xs font-label uppercase tracking-[0.14em] text-muted-foreground">
        Social
      </h3>
      <div className="mt-3">
        <SocialConnect socials={socials} />
      </div>
    </nav>
  );
}

export function SocialConnectLive({
  size = "md",
  className,
  label,
}: Omit<SocialConnectProps, "socials"> & { label?: string }) {
  const [socials, setSocials] = useState<StoreSocials | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStoreSocialsCached()
      .then((data) => {
        if (!cancelled) setSocials(data);
      })
      .catch(() => {
        if (!cancelled) setSocials(EMPTY_STORE_SOCIALS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!socials || !hasAnySocial(socials)) return null;

  if (!label) {
    return <SocialConnect socials={socials} size={size} className={className} />;
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span aria-hidden="true" className="h-px w-8 bg-border" />
      <SocialConnect socials={socials} size={size} />
    </div>
  );
}
