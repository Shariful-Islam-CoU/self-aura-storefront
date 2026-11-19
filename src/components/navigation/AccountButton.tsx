"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { customerAuthService, type Customer } from "@/services/customerAuthService";
import { isAuthError } from "@/lib/api/client";

const actionClass =
  "inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Header account entry.
 *
 * When a signed-in customer has a profile picture, it replaces the generic
 * account icon so the header reflects who is logged in. The avatar lives
 * behind the authenticated `getMe` endpoint, so it is fetched once the token
 * is known to be present client-side; until then (and when there is no
 * picture) the usual person icon is shown.
 */
export function AccountButton() {
  const { isLoggedIn, openLoginModal, signOut } = useAuth();
  const [profile, setProfile] = useState<Customer | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const token = localStorage.getItem("customer_token");
    if (!token) return;

    let cancelled = false;
    customerAuthService
      .getMe(token)
      .then((result) => {
        if (!cancelled) setProfile(result.customer);
      })
      .catch((error) => {
        // An expired/invalid session: reflect it in the header right away.
        // Anything else falls back to the generic icon silently.
        if (!cancelled && isAuthError(error)) signOut();
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, signOut]);

  if (isLoggedIn) {
    return (
      <Link href="/account" aria-label="Account" className={actionClass}>
        {profile?.avatarUrl ? (
          <Avatar src={profile.avatarUrl} name={profile.name} size="sm" />
        ) : (
          <User className="h-5 w-5" aria-hidden="true" />
        )}
      </Link>
    );
  }

  return (
    <button
      onClick={() => openLoginModal(false, "/account")}
      aria-label="Account - sign in"
      className={actionClass}
    >
      <User className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
