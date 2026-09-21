import { API_URL as BASE } from '../config';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar: string;
    vtcId?: number;
    vtcName?: string;
  };
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? 'Login failed');
  }
  return res.json();
}
