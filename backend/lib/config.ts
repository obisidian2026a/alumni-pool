export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return 'http://localhost:3001';
}
