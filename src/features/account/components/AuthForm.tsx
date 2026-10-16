"use client";

import { FormEvent, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { GoogleButton } from "./GoogleButton";
import { customerAuthService } from "@/services/customerAuthService";

interface AuthFormProps {
  mode: "login" | "register";
}

/**
 * Customer authentication placeholder. The form is interactive enough to be
 * honest (submit shows a notice) but no credentials are sent anywhere -
 * real authentication arrives with the backend customer-auth integration.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      if (isRegister) {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const password = formData.get("password") as string;
        const result = await customerAuthService.register({ name, email, phone, password });
        localStorage.setItem("customer_token", result.token);
        window.location.href = "/checkout";
      } else {
        const identifier = formData.get("email") as string;
        const password = formData.get("password") as string;
        const result = await customerAuthService.login(identifier, password);
        localStorage.setItem("customer_token", result.token);
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/checkout";
        window.location.href = redirect;
      }
    } catch (err: any) {
      setNotice(err.message || "Authentication failed");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        {isRegister && (
          <Input
            id="name"
            name="name"
            label="Full name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            required
          />
        )}
        {isRegister && (
          <Input
            id="phone"
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            placeholder="Your phone number"
            required
          />
        )}
        <Input
          id="email"
          name="email"
          label={isRegister ? "Email" : "Email or phone"}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required={!isRegister}
        />
        {!isRegister && (
          <p className="text-xs text-muted-foreground -mt-2">You can also sign in with your phone number</p>
        )}
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={isRegister ? "At least 8 characters" : "Your password"}
          required
          minLength={isRegister ? 8 : undefined}
        />
        <Button type="submit" size="lg" className="w-full">
          {isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="mt-4 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton
        onSuccess={async (credential, profile) => {
          try {
            const result = await customerAuthService.googleAuth(credential);
            localStorage.setItem("customer_token", result.token);
            const redirect = new URLSearchParams(window.location.search).get("redirect") || "/checkout";
            window.location.href = redirect;
          } catch (err: any) {
            setNotice(err.message || "Google authentication failed");
          }
        }}
        onError={() => setNotice("Google authentication failed")}
      />

      {notice && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-md border border-info/30 bg-info/10 p-4"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-foreground">{notice}</p>
        </div>
      )}

      <Separator className="my-6" />

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <a href="/login" className="font-label text-accent transition-colors hover:text-accent/80">
              Sign in
            </a>
          </>
        ) : (
          <>
            New to Self Aura?{" "}
            <a href="/register" className="font-label text-accent transition-colors hover:text-accent/80">
              Create an account
            </a>
          </>
        )}
      </p>
    </div>
  );
}