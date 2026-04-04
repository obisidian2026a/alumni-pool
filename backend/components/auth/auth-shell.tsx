import type { ReactNode } from 'react';
import Link from 'next/link';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkHref,
  footerLinkLabel,
}: AuthShellProps) {
  return (
    <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 overflow-hidden px-4 py-8 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-10">
      <section className="rounded-3xl bg-auth-panel px-8 py-10 text-white shadow-auth-panel md:px-12 md:py-14">
        <p className="text-xs uppercase tracking-[0.24em] text-white/70">Inventory Management</p>
        <h1 className="mt-6 max-w-sm font-heading text-4xl leading-tight md:text-5xl">
          Manage inventory operations, faster.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-white/80 md:text-base">
          A modern workspace to manage products, categories, orders, and stock with confidence.
        </p>
      </section>

      <section className="flex items-center justify-center py-10 lg:py-0">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-auth-card md:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">Welcome Back</p>
          <h2 className="mt-3 font-heading text-3xl text-brand-ink">{title}</h2>
          <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-7 text-sm text-brand-muted">
            {footerText}{' '}
            <Link href={footerLinkHref} className="font-semibold text-brand-primary">
              {footerLinkLabel}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
