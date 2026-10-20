"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleButtonProps {
  onSuccess: (credential: string, profile?: { picture?: string }) => void;
  onError?: () => void;
}

/**
 * Google Identity Services only accepts an explicit pixel width between 200 and
 * 400, and it renders a fixed-width iframe. The old hardcoded `width: 320`
 * therefore overflowed the login dialog on phones, where the dialog content is
 * narrower than 320px. The button now measures its container and renders at
 * that width, clamped to the range Google supports.
 */
const GOOGLE_BUTTON_MIN_WIDTH = 200;
const GOOGLE_BUTTON_MAX_WIDTH = 400;

function clampGoogleButtonWidth(width: number): number {
  return Math.max(
    GOOGLE_BUTTON_MIN_WIDTH,
    Math.min(GOOGLE_BUTTON_MAX_WIDTH, Math.round(width))
  );
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      width?: number;
      type?: string;
      shape?: string;
      text?: string;
      logo_alignment?: string;
    }
  ) => void;
}

/** The Google Identity Services global, or undefined before the script loads. */
function getGoogleIdApi(): GoogleIdApi | undefined {
  return (window as unknown as { google?: { accounts?: { id?: GoogleIdApi } } }).google
    ?.accounts?.id;
}

let isGoogleInitialized = false;

// `initialize` runs once globally and captures a single callback, so route
// credential/error events through the latest mounted consumer's handlers rather
// than the first instance's (stale) closure.
let latestOnSuccess: GoogleButtonProps["onSuccess"] | null = null;
let latestOnError: (() => void) | null = null;

export function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId] = useState(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const renderedWidthRef = useRef<number | null>(null);

  useEffect(() => {
    latestOnSuccess = onSuccess;
    latestOnError = onError ?? null;
  }, [onSuccess, onError]);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const renderGoogleButton = () => {
      const container = buttonRef.current;
      const googleId = getGoogleIdApi();
      if (!container || !googleId) return;

      const width = clampGoogleButtonWidth(container.clientWidth);
      // Google's iframe is fixed-width and re-rendering appends another one, so
      // only re-render when the width actually changed, and clear the previous
      // button first.
      if (renderedWidthRef.current === width) return;
      renderedWidthRef.current = width;

      try {
        container.replaceChildren();
        googleId.renderButton(container, {
          theme: "outline",
          size: "large",
          width,
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "center",
        });
      } catch (e) {
        console.error("Google button render error:", e);
      }
    };

    const initGoogle = async () => {
      // Wait for the Google Identity Services script to load.
      if (!getGoogleIdApi()) {
        await new Promise<void>((resolve, reject) => {
          if (getGoogleIdApi()) {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
          document.head.appendChild(script);
        });
      }

      if (cancelled) return;

      const googleId = getGoogleIdApi();
      if (!googleId) return;

      // Initialize Google Identity Services only once globally.
      if (!isGoogleInitialized) {
        isGoogleInitialized = true;
        googleId.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response?.credential) {
              // Decode the JWT to get profile info including picture.
              let profile: { picture?: string } | undefined;
              try {
                const payload = JSON.parse(atob(response.credential.split(".")[1]));
                profile = { picture: payload.picture };
              } catch (e) {
                console.warn("Failed to decode Google credential", e);
              }
              latestOnSuccess?.(response.credential, profile);
            } else {
              latestOnError?.();
            }
          },
          // One Tap configuration.
          auto_select: false,
          cancel_on_tap_outside: true,
          // Request profile scope to get the picture (included in the ID token
          // payload for One Tap).
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
        });
      }

      renderGoogleButton();

      // Keep the button matched to its container (dialog width, orientation,
      // on-screen keyboard) instead of overflowing it.
      if (typeof ResizeObserver !== "undefined" && buttonRef.current) {
        resizeObserver = new ResizeObserver(renderGoogleButton);
        resizeObserver.observe(buttonRef.current);
      }
    };

    initGoogle().catch((err) => {
      console.error("Google Sign-In init failed:", err);
      latestOnError?.();
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="mt-4 text-sm text-center text-muted-foreground">
        Google Sign-In not configured
      </div>
    );
  }

  return <div ref={buttonRef} className="mt-4 w-full max-w-xs mx-auto" />;
}
