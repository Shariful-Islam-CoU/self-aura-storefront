"use client";

import { useState } from "react";
import { Share2, Link, MessageSquare, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ShareProductProps {
  /** The canonical product URL to share. */
  url: string;
  /** The product name for the share text. */
  title: string;
  /** Optional product description for the share text. */
  description?: string;
  /** Optional product image for social previews. */
  image?: string;
}

const SHARE_BASE_URL = "https://www.facebook.com/sharer/sharer.php";
const MESSENGER_SHARE_BASE_URL = "https://www.facebook.com/dialog/send";
const WHATSAPP_SHARE_BASE_URL = "https://wa.me/";

function buildFacebookShareUrl(url: string, quote?: string): string {
  const params = new URLSearchParams({ u: url });
  if (quote) params.set("quote", quote);
  return `${SHARE_BASE_URL}?${params.toString()}`;
}

function buildMessengerShareUrl(url: string): string {
  const params = new URLSearchParams({
    app_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "",
    link: url,
  });
  return `${MESSENGER_SHARE_BASE_URL}?${params.toString()}`;
}

function buildWhatsAppShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams();
  if (text) params.set("text", text);
  params.set("url", url);
  return `${WHATSAPP_SHARE_BASE_URL}?${params.toString()}`;
}

/**
 * A simple share button with a dropdown for sharing a product across platforms.
 *
 * Supported platforms:
 * - Native Web Share API (preferred on mobile)
 * - Copy link (always available)
 * - Facebook
 * - Messenger
 * - WhatsApp
 *
 * The native Web Share API is preferred on mobile devices where available.
 * On desktop, the dropdown provides platform-specific links.
 */
export function ShareProduct({ url, title, description, image }: ShareProductProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `${title}${description ? ` - ${description}` : ""}`;
  const shareUrl = url;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available - fallback to manual copy
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      // Fallback: copy to clipboard
      await copyToClipboard();
      return;
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl,
      });
    } catch {
      // User cancelled or error - silently ignore
      console.debug("[ShareProduct] Native share cancelled or failed:");
    }
  };

  const handleFacebookShare = () => {
    window.open(buildFacebookShareUrl(shareUrl, description), "_blank", "width=600,height=400");
  };

  const handleMessengerShare = () => {
    window.open(buildMessengerShareUrl(shareUrl), "_blank", "width=600,height=400");
  };

  const handleWhatsAppShare = () => {
    window.open(buildWhatsAppShareUrl(shareUrl, shareText), "_blank", "width=600,height=400");
  };

  const handleCopyLink = async () => {
    await copyToClipboard();
  };

  const hasNativeShare = typeof navigator !== "undefined" && navigator.share;

  // image prop is accepted for API compatibility but not used in this component
  // (it could be used for native share in the future)
  void image;

  return (
    <div className="relative inline-block">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label="Share product"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Share</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-in fade-in-0 zoom-in-95">
          <div className="rounded-md border border-border bg-card p-2 shadow-lg">
            <button
              onClick={handleNativeShare}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {hasNativeShare ? (
                <>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share via...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" aria-hidden="true" />
                  Copy link
                </>
              )}
            </button>
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" aria-hidden="true" />
                  Copy link
                </>
              )}
            </button>
            <button
              onClick={handleFacebookShare}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Facebook
            </button>
            <button
              onClick={handleMessengerShare}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Messenger
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}