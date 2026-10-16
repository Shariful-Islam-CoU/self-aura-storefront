"use client";

import { useEffect, useState } from "react";
import { X, LogIn, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./Dialog";
import { Button } from "./Button";
import { Separator } from "./Separator";
import { Input } from "./Input";
import { customerAuthService, AuthResult } from "@/services/customerAuthService";
import { GoogleButton } from "@/features/account/components/GoogleButton";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean; // if true, cannot skip/close without login
  redirectUrl?: string;
}

export function LoginModal({ isOpen, onClose, required = false, redirectUrl: propRedirectUrl }: LoginModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Priority: prop > searchParams > default /checkout
  const redirectUrl = propRedirectUrl || searchParams.get("redirect") || "/checkout";

  const handleSwitchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result: AuthResult;
      if (mode === "register") {
        result = await customerAuthService.register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });
      } else {
        result = await customerAuthService.login(form.email, form.password);
      }
      localStorage.setItem("customer_token", result.token);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerAuthService.googleAuth(credential);
      localStorage.setItem("customer_token", result.token);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={required ? undefined : onClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{mode === "login" ? "Welcome back" : "Create your account"}</DialogTitle>
              <DialogDescription>
                {mode === "login"
                  ? "Sign in to access your account, track orders, and checkout faster."
                  : "Join Self Aura to track orders, save favorites, and checkout faster."}
              </DialogDescription>
            </div>
            {!required && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
          {mode === "register" && (
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
            />
          )}
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={loading}>
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <GoogleButton
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google authentication failed")}
        />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              New to Self Aura?{" "}
              <Button variant="ghost" size="sm" onClick={handleSwitchMode} className="p-0 h-auto">
                Create an account
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button variant="ghost" size="sm" onClick={handleSwitchMode} className="p-0 h-auto">
                Sign in
              </Button>
            </>
          )}
        </p>

        {!required && (
          <Button
            variant="ghost"
            className="mt-4 w-full"
            onClick={onClose}
          >
            Continue as guest
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}