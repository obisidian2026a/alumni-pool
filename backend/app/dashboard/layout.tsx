'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  RefreshCcw,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Live Overview', icon: <LayoutDashboard size={16} /> },
  { href: '/dashboard/products', label: 'Products', icon: <Package size={16} /> },
  { href: '/dashboard/orders', label: 'Orders', icon: <ClipboardList size={16} /> },
  { href: '/dashboard/activity', label: 'Activity', icon: <Activity size={16} /> },
  { href: '/dashboard/categories', label: 'Categories', icon: <Boxes size={16} /> },
  { href: '/dashboard/restock', label: 'Restock Queue', icon: <RefreshCcw size={16} /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={16} /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const token = localStorage.getItem('auth_access_token');
    if (!token) {
      router.replace('/login');
      return;
    }

  }, [router]);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const normalizedPath = useMemo(() => {
    if (pathname === '/dashboard/category') {
      return '/dashboard/categories';
    }
    return pathname;
  }, [pathname]);

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <div className="grid min-h-screen gap-4 p-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border border-brand-line bg-white p-4">
          <div className="px-2 pb-5 pt-2">
            <p className="text-lg font-semibold text-brand-ink">i&O</p>
            <p className="pt-1 text-xs uppercase tracking-wide text-brand-muted">Inventory Management</p>
          </div>

          <nav className="flex gap-2 overflow-x-auto whitespace-nowrap lg:flex-col lg:overflow-visible" aria-label="Dashboard navigation">
            {navItems.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 border px-4 py-2 text-left text-sm font-medium transition lg:w-full ${
                    isActive
                      ? 'border-brand-line bg-brand-soft text-brand-ink'
                      : 'border-transparent bg-transparent text-brand-muted hover:border-brand-line hover:bg-brand-soft hover:text-brand-ink'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          <header className="border border-brand-line bg-white px-4 py-4 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-brand-muted">{currentTime.toLocaleString()}</p>
              <div>
                <button
                  onClick={() => {
                    localStorage.removeItem('auth_access_token');
                    localStorage.removeItem('auth_user');
                    router.push('/login');
                  }}
                  className="border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="border border-brand-line bg-white p-4 md:p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
