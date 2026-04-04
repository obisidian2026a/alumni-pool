'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

function hasStrongPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return name.trim().length >= 2 && email.includes('@') && hasStrongPassword(password);
  }, [name, email, password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.signup({
        name: name.trim(),
        email,
        password,
      });

      localStorage.setItem('auth_access_token', response.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to create account. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create Account"
      subtitle="Start managing your alumni operations with a secure account."
      footerText="Already have an account?"
      footerLinkHref="/login"
      footerLinkLabel="Sign in"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-brand-ink">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            className="w-full rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-primary"
            placeholder="Jane Doe"
          />
        </div>

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
            autoComplete="new-password"
            required
            className="w-full rounded-xl border border-brand-line bg-brand-soft px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-primary"
            placeholder="At least 8 chars with letters and numbers"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthShell>
  );
}
