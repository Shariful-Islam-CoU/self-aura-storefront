"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { customerAuthService, Customer } from "@/services/customerAuthService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/login?redirect=/account/change-password");
      return;
    }
    customerAuthService
      .getMe(token)
      .then((res) => {
        setCustomer(res.customer);
        setLoading(false);
      })
      .catch((err) => {
        localStorage.removeItem("customer_token");
        router.push("/login?redirect=/account/change-password");
      });
  }, [router]);

  const handleChangePassword = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    setPasswordNotice(null);

    if (newPassword.length < 8) {
      setPasswordNotice("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordNotice("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const result = await customerAuthService.changePassword(
        token,
        currentPassword,
        newPassword
      );
      setCustomer(result.customer);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordNotice("Password updated successfully.");
      if (customer?.mustChangePassword) {
        router.push("/account");
      }
    } catch (err: any) {
      setPasswordNotice(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <LoadingState label="Loading..." />;

  if (customer?.mustChangePassword) {
    return (
      <div className="w-full max-w-xl">
        <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Account security</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
          Choose a new password
        </h1>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm text-muted-foreground">
            Self Aura issued a one-time password for your account. Enter it below
            and choose a password only you know.
          </p>
          <div className="mt-6 space-y-4">
            <Input
              label="One-time password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              helperText="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
          {passwordNotice && (
            <p className="mt-4 text-sm text-destructive">{passwordNotice}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              onClick={handleChangePassword}
              isLoading={changingPassword}
              disabled={changingPassword}
            >
              Save new password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                localStorage.removeItem("customer_token");
                router.push("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Account security</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
        Change password
      </h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {customer?.authType === "google" ? (
          <p className="text-sm text-muted-foreground">
            This account signs in with Google. Password sign-in is not available
            for Google accounts, so there is no password to set here.
          </p>
        ) : customer?.authType === "password" ? (
          <>
            <p className="text-sm text-muted-foreground">
              Change the password you use with your phone number or email.
            </p>
            <div className="mt-6 space-y-4">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                helperText="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                onClick={handleChangePassword}
                isLoading={changingPassword}
                disabled={changingPassword}
              >
                Change password
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No online sign-in is set up for this account yet. Ask Self Aura to
            create a password for you.
          </p>
        )}
        {passwordNotice && (
          <p
            className={`mt-4 text-sm ${
              passwordNotice.includes("success") ? "text-foreground" : "text-destructive"
            }`}
          >
            {passwordNotice}
          </p>
        )}
      </div>
    </div>
  );
}
