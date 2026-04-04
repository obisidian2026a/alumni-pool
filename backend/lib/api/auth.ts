import { ApiError } from '@/lib/api/client';
import { getApiBaseUrl } from '@/lib/config';
import type { AuthResponse } from '@/types/auth';

async function request<T>(path: string, payload: Record<string, string>): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : 'Request failed';
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const authApi = {
  signup: (payload: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/signup', payload),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', payload),
};

export { ApiError };
