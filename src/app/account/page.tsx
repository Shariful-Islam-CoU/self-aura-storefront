"use client";

import { useEffect, useState } from "react";
import { customerAuthService, Customer } from "@/services/customerAuthService";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Avatar } from "@/components/ui/Avatar";

export default function AccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      window.location.href = "/login?redirect=/account";
      return;
    }
    Promise.all([
      customerAuthService.getMe(token),
      customerAuthService.getAddresses(token).catch(() => ({ addresses: [] })),
    ])
      .then(([meRes, addrRes]) => {
        setCustomer(meRes.customer);
        setAddresses(addrRes.addresses ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        localStorage.removeItem("customer_token");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    window.location.href = "/";
  };

  if (loading) {
    return <div className="py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="py-8">
        <p className="text-sm text-red-500">{error}</p>
        <Button className="mt-4" onClick={() => (window.location.href = "/login")}>
          Sign in again
        </Button>
      </div>
    );
  }

  const cust = customer as any;
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="w-full">
      <p className="text-xs font-label uppercase tracking-[0.22em] text-accent">My account</p>
      <div className="mt-6 flex items-center gap-4">
        <Avatar src={cust?.avatarUrl} name={customer?.name} size="xl" />
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
            Welcome, {customer?.name}
          </h1>
          <p className="text-sm text-muted-foreground">{customer?.email}</p>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="mt-1">{customer?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="mt-1">{customer?.email}</p>
          </div>
          {customer?.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="mt-1">{customer.phone}</p>
            </div>
          )}
          {cust?.facebookName && (
            <div>
              <p className="text-sm text-muted-foreground">Facebook Name</p>
              <p className="mt-1">{cust.facebookName}</p>
            </div>
          )}
          {cust?.facebookProfileUrl && (
            <div>
              <p className="text-sm text-muted-foreground">Facebook Profile</p>
              <p className="mt-1">
                <a href={cust.facebookProfileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                  {cust.facebookProfileUrl}
                </a>
              </p>
            </div>
          )}
        </div>

        {defaultAddress && (
          <>
            <Separator className="my-8" />
            <div>
              <p className="text-xs font-label uppercase tracking-[0.22em] text-accent mb-4">Default Address</p>
              <div className="space-y-2">
                {defaultAddress.recipientName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Recipient</p>
                    <p className="mt-1">{defaultAddress.recipientName}</p>
                  </div>
                )}
                {defaultAddress.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="mt-1">{defaultAddress.phone}</p>
                  </div>
                )}
                {defaultAddress.addressLine && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="mt-1">{defaultAddress.addressLine}</p>
                  </div>
                )}
                {defaultAddress.area && (
                  <div>
                    <p className="text-sm text-muted-foreground">Area/Thana</p>
                    <p className="mt-1">{defaultAddress.area}</p>
                  </div>
                )}
                {defaultAddress.city && (
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="mt-1">{defaultAddress.city}</p>
                  </div>
                )}
                {defaultAddress.postalCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Postal Code</p>
                    <p className="mt-1">{defaultAddress.postalCode}</p>
                  </div>
                )}
                {defaultAddress.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="mt-1">{defaultAddress.country}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {addresses.length > 1 && (
          <>
            <Separator className="my-8" />
            <div>
              <p className="text-xs font-label uppercase tracking-[0.22em] text-accent mb-4">Other Addresses</p>
              <div className="space-y-4">
                {addresses
                  .filter((a) => !a.isDefault)
                  .map((addr) => (
                    <div key={addr._id} className="rounded-lg border border-border p-4">
                      <div className="space-y-1">
                        {addr.label && <p className="font-medium text-sm">{addr.label}</p>}
                        {addr.recipientName && <p className="text-sm">{addr.recipientName}</p>}
                        {addr.phone && <p className="text-sm">{addr.phone}</p>}
                        {addr.addressLine && <p className="text-sm">{addr.addressLine}</p>}
                        {addr.area && <p className="text-sm">{addr.area}</p>}
                        {addr.city && <p className="text-sm">{addr.city}</p>}
                        {addr.postalCode && <p className="text-sm">{addr.postalCode}</p>}
                        {addr.country && <p className="text-sm">{addr.country}</p>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-8 flex gap-3">
          <Button onClick={() => (window.location.href = "/account/edit")}>
            Edit profile
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}