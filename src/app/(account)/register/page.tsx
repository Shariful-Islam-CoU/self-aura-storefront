import type { Metadata } from "next";
import { AuthForm } from "@/features/account/components/AuthForm";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Join Self Aura</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-foreground">
        Create your account
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Create your account using email + password or continue with Google.
      </p>
      <div className="mt-8 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}