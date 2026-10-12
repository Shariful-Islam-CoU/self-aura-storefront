"use client";

import { useEffect, useState } from "react";
import { customerAuthService, Customer } from "@/services/customerAuthService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";

export default function EditAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    facebookName: "",
    facebookProfileUrl: "",
  });
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
          <Button type="submit" isLoading={saving} disabled={saving}>
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
