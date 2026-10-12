import type { Metadata } from "next";
import { AuthForm } from "@/features/account/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Welcome back</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground">
        Sign in to Self Aura
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Sign in to your account or continue with Google.
      </p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}