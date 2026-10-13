const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export interface Customer {
  name: string;
  email: string;
  phone?: string;
  defaultAddress?: any;
}

export interface AuthResult {
  customer: Customer;
  token: string;
}

export const customerAuthService = {
  async register(data: { name: string; email: string; phone: string; password: string }): Promise<AuthResult> {
    const res = await fetch(`${API_BASE}/customer/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json.data;
  },

  async login(identifier: string, password: string): Promise<AuthResult> {
    const res = await fetch(`${API_BASE}/customer/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json.data;
  },

  async googleAuth(credential: string): Promise<AuthResult> {
    const res = await fetch(`${API_BASE}/customer/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: credential, tokenId: credential }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Google auth failed');
    return json.data;
  },

  async getMe(token: string): Promise<{ customer: Customer }> {
    const res = await fetch(`${API_BASE}/customer/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to get profile');
    return json.data;
  },

  async updateProfile(token: string, data: any): Promise<{ customer: Customer }> {
    const res = await fetch(`${API_BASE}/customer/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update profile');
    return json.data;
  },

  async getAddresses(token: string): Promise<any> {
    const res = await fetch(`${API_BASE}/customer/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to get addresses');
    return json.data;
  },

  async addAddress(token: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/customer/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to add address');
    return json.data;
  },

  async updateAddress(token: string, addressId: string, data: any): Promise<any> {
    const res = await fetch(`${API_BASE}/customer/addresses/${addressId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update address');
    return json.data;
  },
};
