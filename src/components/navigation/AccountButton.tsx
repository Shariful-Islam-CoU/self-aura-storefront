"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AccountButton() {
  const { isLoggedIn, openLoginModal } = useAuth();

  if (isLoggedIn) {
    return (
      <Link
        href="/account"
        aria-label="Account"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <User className="h-5 w-5" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <button
      onClick={() => openLoginModal(false, "/account")}
      aria-label="Account - sign in"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <User className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}