"use client";

import { useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FloatingMessengerButtonProps {
  /** Full m.me URL with prefilled text */
  href: string;
  /** Plain-text product message, copied to the clipboard as a fallback */
  message: string;
  /** Product name for aria-label */
  productName: string;
}

/**
 * Copy text to the clipboard with a legacy fallback for browsers that do not
 * expose the async Clipboard API (or block it outside HTTPS).
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/**
 * Fixed floating "Ask about this Product" button.
 *
 * Always visible on the right edge while scrolling. The anchor opens Messenger
 * in a new tab with the product message prefilled. Messenger's web client
 * sometimes drops that prefill (especially after a login redirect), so the
 * same message is also copied to the clipboard and a short hint is shown.
 */
export function FloatingMessengerButton({
  href,
  message,
  productName,
}: FloatingMessengerButtonProps) {
  const [hint, setHint] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showHint = (text: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setHint(text);
    timeoutRef.current = window.setTimeout(() => setHint(null), 12000);
  };

  const handleClick = () => {
    // Show the hint synchronously: the Messenger tab takes focus immediately,
    // so this is what the customer sees when they come back to the store.
    showHint("Product details copied — paste them in Messenger if the message box is empty.");

    // Fire-and-forget: the anchor's default navigation must not wait on this.
    void copyToClipboard(message).then((copied) => {
      if (!copied) {
        showHint(
          "If the message box is empty, copy the product link from the address bar and paste it in Messenger."
        );
      }
    });
  };

  return (
    <>
      {hint ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed right-4 bottom-24 z-50 sm:bottom-20",
            "max-w-[16rem] rounded-lg border border-border bg-card px-3 py-2",
            "text-xs leading-relaxed text-foreground shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2"
          )}
        >
          {hint}
        </div>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label={`Ask about ${productName} on Messenger (opens in a new tab)`}
        className={cn(
          "fixed right-4 bottom-4 z-50",
          "inline-flex items-center justify-center gap-2",
          "h-14 w-14 sm:h-12 sm:w-auto sm:px-4",
          "rounded-full",
          "bg-primary text-primary-foreground",
          "font-label text-sm font-medium",
          "shadow-lg shadow-primary/30",
          "transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "animate-in fade-in slide-in-from-bottom-2 zoom-in-95",
          "sm:pr-4"
        )}
      >
        <MessageSquare className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span className="hidden whitespace-nowrap sm:inline">Ask about this Product</span>
      </a>
    </>
  );
}
