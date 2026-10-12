"use client";

import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

/**
 * Portal component for rendering children in a different DOM node.
 * Used by SelectContent, Dialog, Tooltip, etc.
 */
export function Portal({ children, container }: PortalProps) {
  const target = container || (typeof document !== "undefined" ? document.body : null);

  if (!target) {
    return null;
  }

  return createPortal(children, target);
}