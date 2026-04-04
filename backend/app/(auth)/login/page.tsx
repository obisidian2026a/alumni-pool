'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

const DEMO_USER = {
  email: 'admin@inventory.local',
  password: 'AdminPass123',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return email.includes('@') && password.length >= 8;
  }, [email, password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      localStorage.setItem('auth_access_token', response.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to login. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign In"
      subtitle="Use your account credentials to access the admin dashboard."
      footerText="Don’t have an account?"
      footerLinkHref="/signup"
      footerLinkLabel="Create one"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-brand-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="w-full rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-primary"
            placeholder="name@company.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-brand-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-primary"
            placeholder="At least 8 characters"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_USER.email);
              setPassword(DEMO_USER.password);
            }}
            className="w-full rounded-xl border border-brand-line bg-white px-4 py-3 text-sm font-semibold text-brand-ink transition hover:bg-brand-soft"
          >
            Use Admin Login
          </button>
        </div>

        <p className="text-xs text-brand-muted">
          Admin Credentials: {DEMO_USER.email} / {DEMO_USER.password}
        </p>
      </form>
    </AuthShell>
  );
}
