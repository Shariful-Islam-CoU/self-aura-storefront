"use client";

import { useEffect, useState, useRef } from "react";
import { customerAuthService, Customer } from "@/services/customerAuthService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { useRouter } from "next/navigation";

export default function EditAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    facebookName: "",
    facebookProfileUrl: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isGoogleAvatar, setIsGoogleAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [address, setAddress] = useState({
    label: "Home",
    recipientName: "",
    phone: "",
    addressLine: "",
    area: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
    isDefault: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/login?redirect=/account/edit");
      return;
    }
    Promise.all([
      customerAuthService.getMe(token),
      customerAuthService.getAddresses(token).catch(() => ({ addresses: [] })),
    ])
      .then(([meRes, addrRes]) => {
        const cust = meRes.customer as any;
        setForm({
          name: cust.name || "",
          email: cust.email || "",
          phone: cust.phone || "",
          facebookName: cust.facebookName || "",
          facebookProfileUrl: cust.facebookProfileUrl || "",
        });
        setAvatarUrl(cust.avatarUrl || null);
        setIsGoogleAvatar(!!cust.avatarUrl && cust.avatarUrl.includes("googleusercontent.com"));
        if (addrRes.addresses?.[0]) {
          const a = addrRes.addresses[0];
          setAddress({
            label: a.label || "Home",
            recipientName: a.recipientName || cust.name || "",
            phone: a.phone || cust.phone || "",
            addressLine: a.addressLine || "",
            area: a.area || "",
            city: a.city || "",
            postalCode: a.postalCode || "",
            country: a.country || "Bangladesh",
            isDefault: a.isDefault ?? true,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        localStorage.removeItem("customer_token");
        router.push("/login");
      });
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload JPEG, PNG, or WebP image.");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    const token = localStorage.getItem("customer_token");
    if (!token) return;

    setAvatarUploading(true);
    setError(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      const result = await customerAuthService.uploadAvatar(token, file);
      setAvatarUrl(result.customer.avatarUrl ?? null);
      setIsGoogleAvatar(false);
      setAvatarPreview(null);
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;

    setSaving(true);
    setError(null);
    try {
      await customerAuthService.deleteAvatar(token);
      setAvatarUrl(null);
      setIsGoogleAvatar(false);
    } catch (err: any) {
      setError(err.message || "Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleUseGoogleAvatar = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;

    // Get the Google avatar URL from the current customer data
    try {
      const meRes = await customerAuthService.getMe(token);
      const cust = meRes.customer as any;
      // The Google avatar would have been stored during Google auth
      // If we're here, we want to restore it
      // This is a placeholder - actual logic depends on how we store the Google avatar
    } catch (err) {
      console.error("Failed to get Google avatar", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await customerAuthService.updateProfile(token, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        facebookName: form.facebookName || undefined,
        facebookProfileUrl: form.facebookProfileUrl || undefined,
      });
      // Check if we have an existing address to update
      const existingAddresses = await customerAuthService.getAddresses(token).catch(() => ({ addresses: [] }));
      if (existingAddresses.addresses?.length > 0) {
        await customerAuthService.updateAddress(token, existingAddresses.addresses[0]._id, address).catch(() => {});
      } else {
        await customerAuthService.addAddress(token, address).catch(() => {});
      }
      router.push("/account");
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8">Loading...</div>;

  return (
    <div className="w-full max-w-2xl">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">Account</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
        Edit profile
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-6">
          <h2 className="font-label text-sm font-semibold text-foreground">Profile picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={avatarPreview || avatarUrl}
                name={form.name}
                size="xl"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
                title="Change avatar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={avatarUploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? "Uploading..." : "Upload new"}
              </Button>
              {avatarUrl && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={saving || avatarUploading}
                  >
                    Remove
                  </Button>
                  {isGoogleAvatar && (
                    <p className="text-xs text-muted-foreground">
                      Current: Google profile picture
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="font-label text-sm font-semibold text-foreground">Personal details</h2>
          <Input
            label="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Facebook Name (Optional)"
            value={form.facebookName}
            onChange={(e) => setForm({ ...form, facebookName: e.target.value })}
          />
          <Input
            label="Facebook Profile URL (Optional)"
            type="url"
            value={form.facebookProfileUrl}
            onChange={(e) => setForm({ ...form, facebookProfileUrl: e.target.value })}
          />
        </div>

        <div className="space-y-6">
          <h2 className="font-label text-sm font-semibold text-foreground">Default address</h2>
          <Input
            label="Recipient name"
            value={address.recipientName}
            onChange={(e) => setAddress({ ...address, recipientName: e.target.value })}
          />
          <Input
            label="Recipient phone"
            type="tel"
            value={address.phone}
            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          />
          <Textarea
            label="Address line"
            rows={3}
            value={address.addressLine}
            onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Area/Thana"
              value={address.area}
              onChange={(e) => setAddress({ ...address, area: e.target.value })}
            />
            <Input
              label="City"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Postal code"
              value={address.postalCode}
              onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
            />
            <Input
              label="Country"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" isLoading={saving} disabled={saving || avatarUploading}>
            Save changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
