import { api, ApiError } from "@/lib/api/client";

export interface CustomerAddress {
  _id?: string;
  id?: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  addressLine?: string;
  area?: string;
  district?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
  [key: string]: unknown;
}

export interface Customer {
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  facebookName?: string | null;
  facebookProfileUrl?: string | null;
  defaultAddress?: CustomerAddress;
  /** `password` accounts can change their password; Google accounts cannot. */
  authType: "none" | "password" | "google";
  /** True immediately after staff issue a one-time password. */
  mustChangePassword: boolean;
}

export interface AuthResult {
  customer: Customer;
  token: string;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  facebookName?: string;
  facebookProfileUrl?: string;
  [key: string]: unknown;
}

export interface AddressesResult {
  addresses: CustomerAddress[];
  [key: string]: unknown;
}

/**
 * Customer auth/profile endpoints.
 *
 * Goes through the shared API client, so every call has a timeout, tolerates
 * non-JSON error pages (e.g. a proxy 502) and throws an `ApiError` carrying
 * the HTTP status. Callers use `isAuthError` to tell an expired session (401)
 * apart from a transient failure - only the former should sign the customer
 * out.
 */
type Envelope<T> = { success?: boolean; data: T; message?: string };

async function unwrap<T>(promise: Promise<Envelope<T> | null>, fallbackMessage: string): Promise<T> {
  try {
    const json = await promise;
    if (!json || json.data === undefined) throw new ApiError(500, fallbackMessage, json);
    return json.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Transport failure (offline, timeout): replace the raw "Failed to fetch".
    throw new ApiError(0, "We couldn't reach Self Aura. Please check your connection and try again.");
  }
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const customerAuthService = {
  register(data: { name: string; email?: string; phone: string; password: string }) {
    return unwrap<AuthResult>(
      api.post("/customer/auth/register", data),
      "Registration failed"
    );
  },

  login(identifier: string, password: string) {
    return unwrap<AuthResult>(
      api.post("/customer/auth/login", { identifier, password }),
      "Login failed"
    );
  },

  googleAuth(credential: string) {
    // The backend verifies this ID token and reads the identity from it.
    return unwrap<AuthResult>(
      api.post("/customer/auth/google", { idToken: credential }),
      "Google auth failed"
    );
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return unwrap<{ customer: Customer }>(
      api.post("/customer/auth/change-password", { currentPassword, newPassword }, auth(token)),
      "Failed to change password"
    );
  },

  getMe(token: string) {
    return unwrap<{ customer: Customer }>(
      api.get("/customer/auth/me", auth(token)),
      "Failed to get profile"
    );
  },

  updateProfile(token: string, data: ProfileUpdate) {
    return unwrap<{ customer: Customer }>(
      api.patch("/customer/profile", data, auth(token)),
      "Failed to update profile"
    );
  },

  getAddresses(token: string) {
    return unwrap<AddressesResult>(
      api.get("/customer/addresses", auth(token)),
      "Failed to get addresses"
    );
  },

  addAddress(token: string, data: Partial<CustomerAddress>) {
    return unwrap<{ address?: CustomerAddress; addresses?: CustomerAddress[] }>(
      api.post("/customer/addresses", data, auth(token)),
      "Failed to add address"
    );
  },

  updateAddress(token: string, addressId: string, data: Partial<CustomerAddress>) {
    return unwrap<{ address?: CustomerAddress; addresses?: CustomerAddress[] }>(
      api.patch(`/customer/addresses/${encodeURIComponent(addressId)}`, data, auth(token)),
      "Failed to update address"
    );
  },

  updateAvatar(token: string, avatarUrl: string | null) {
    return unwrap<{ customer: Customer }>(
      api.patch("/customer/profile/avatar", { avatarUrl }, auth(token)),
      "Failed to update avatar"
    );
  },

  uploadAvatar(token: string, file: File) {
    const formData = new FormData();
    formData.append("avatar", file);
    return unwrap<{ customer: Customer }>(
      api.post("/customer/profile/avatar", formData, { ...auth(token), timeoutMs: 60_000 }),
      "Failed to upload avatar"
    );
  },

  deleteAvatar(token: string) {
    return unwrap<{ customer: Customer }>(
      api.delete("/customer/profile/avatar", auth(token)),
      "Failed to delete avatar"
    );
  },
};
