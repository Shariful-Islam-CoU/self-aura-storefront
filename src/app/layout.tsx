import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/config/env";
import { CartProvider } from "@/features/cart/context/CartProvider";
import { WishlistProvider } from "@/features/wishlist/context/WishlistProvider";
import { AnalyticsProvider } from "@/lib/analytics/provider";

/**
 * Typography: Playfair Display (display/serif headings) paired with Inter
 * (body). Loaded through next/font so fonts are self-hosted at build time -
 * no runtime external font requests.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Self Aura",
    template: "%s · Self Aura",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    // The source asset is actually a PNG (1920x1920) despite its `.svg` name,
    // so the favicon uses a resized, correctly-typed PNG copy.
    icon: [{ url: "/images/self_aura_dark_theme.png", type: "image/png", sizes: "256x256" }],
    shortcut: "/images/self_aura_dark_theme.png",
    apple: [{ url: "/images/self_aura_dark_theme.png", sizes: "256x256" }],
  },
  keywords: ["jewelry", "self aura", "lifestyle", "gifts"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: "Self Aura",
    description: siteConfig.description,
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Self Aura — premium curated collection of jewelry and lifestyle pieces",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Self Aura",
    description: siteConfig.description,
    images: ["/images/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1012" },
  ],
};

/**
 * Applies the system dark preference to <html> before first paint so the page
 * never flashes the wrong color scheme. The storefront defaults to light;
 * `.dark` is enabled only when the system prefers dark. A future theme
 * control can persist a choice in localStorage with the same contract.
 */
const themeInitScript = `(function(){try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <AnalyticsProvider>
          <WishlistProvider>
            <CartProvider>{children}</CartProvider>
          </WishlistProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}