import { StorefrontShell } from "@/components/layout/StorefrontShell";

/**
 * Store routes (shop, categories, products) share the full storefront chrome:
 * header, footer, and the container shell.
 */
export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <StorefrontShell>{children}</StorefrontShell>;
}