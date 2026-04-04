import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-background">{children}</div>;
}
