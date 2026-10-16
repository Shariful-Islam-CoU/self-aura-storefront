"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleButtonProps {
  onSuccess: (credential: string, profile?: { picture?: string }) => void;
  onError?: () => void;
}

let isGoogleInitialized = false;

export function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [clientId] = useState(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initGoogle = async () => {
      // Wait for Google script to load
      if (!(window as any).google?.accounts?.id) {
        await new Promise<void>((resolve, reject) => {
          if ((window as any).google?.accounts?.id) {
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

      // Initialize Google Identity Services only once globally
      if (!isGoogleInitialized) {
        isGoogleInitialized = true;
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              // Decode the JWT to get profile info including picture
              let profile: { picture?: string } | undefined;
              try {
                const payload = JSON.parse(atob(response.credential.split('.')[1]));
                profile = { picture: payload.picture };
              } catch (e) {
                console.warn("Failed to decode Google credential", e);
              }
              onSuccess(response.credential, profile);
            } else {
              onError?.();
            }
          },
          // One Tap configuration
          auto_select: false,
          cancel_on_tap_outside: true,
          // Request profile scope to get picture
          // Note: For One Tap, the picture is included in the ID token payload
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
        });
      }

      // Render the button
      if (buttonRef.current) {
        try {
          (window as any).google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 320,
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "center",
          });
        } catch (e) {
          console.error("Google button render error:", e);
        }
      }
      setLoaded(true);
    };

    initGoogle().catch((err) => {
      console.error("Google Sign-In init failed:", err);
      onError?.();
    });
  }, [clientId, onSuccess, onError]);

  if (!clientId) {
    return (
      <div className="mt-4 text-sm text-center text-muted-foreground">
        Google Sign-In not configured
      </div>
    );
  }

  return <div ref={buttonRef} className="mt-4 w-full max-w-xs mx-auto" />;
}