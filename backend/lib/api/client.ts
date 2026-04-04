import { getApiBaseUrl } from '@/lib/config';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  payload?: unknown;
}

function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('auth_access_token');
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options.payload !== undefined ? { body: JSON.stringify(options.payload) } : {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.message === 'string'
        ? data.message
        : 'Request failed. Please try again.';
    throw new ApiError(message, response.status);
  }

  return data as T;
}
