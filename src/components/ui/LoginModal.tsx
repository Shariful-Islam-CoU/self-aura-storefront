"use client";

import { useEffect, useState } from "react";
import { X, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
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
  /** Called after a successful login/register/Google sign-in. */
  onSuccess?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  required = false,
  redirectUrl: propRedirectUrl,
  onSuccess,
}: LoginModalProps) {
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
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Priority: prop > searchParams > default / (home)
  const redirectUrl = propRedirectUrl || searchParams.get("redirect") || "/";

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
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
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
      setLoading(false);
      // Let the parent react first (e.g. close the modal in-place on /checkout),
      // then navigate for the pages that rely on a redirect.
      onSuccess?.();
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
      setLoading(false);
      onSuccess?.();
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
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
            endAdornment={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            }
          />
          {mode === "register" && (
            <Input
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              autoComplete="new-password"
              minLength={8}
              endAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              }
            />
          )}
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
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Please login to track your orders
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}