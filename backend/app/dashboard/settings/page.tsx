'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { inventoryApi } from '@/lib/api/inventory';
import type { AuthUser } from '@/types/auth';
import type { EmployeeUser } from '@/types/inventory';

export default function DashboardSettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        name: '',
        email: '',
        role: 'manager' as 'admin' | 'manager',
      };
    }

    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      return {
        name: '',
        email: '',
        role: 'manager' as 'admin' | 'manager',
      };
    }

    try {
      const user = JSON.parse(raw) as Partial<AuthUser>;
      return {
        name: user.name ?? '',
        email: user.email ?? '',
        role: user.role === 'admin' ? 'admin' : 'manager',
      };
    } catch {
      return {
        name: '',
        email: '',
        role: 'manager' as 'admin' | 'manager',
      };
    }
  });

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdminDataLoading, setIsAdminDataLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [roleSummary, setRoleSummary] = useState<Array<{ role: 'admin' | 'manager'; count: number }>>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, 'admin' | 'manager'>>({});

  const initials = useMemo(() => {
    const source = profile.name || profile.email || 'U';
    return source.trim().slice(0, 2).toUpperCase();
  }, [profile.email, profile.name]);

  useEffect(() => {
    if (profile.role !== 'admin') {
      return;
    }

    setIsAdminDataLoading(true);
    inventoryApi
      .adminListUsers()
      .then((data) => {
        setRoleSummary(data.roles);
        setEmployees(data.employees);
        setRoleDrafts(
          data.employees.reduce<Record<string, 'admin' | 'manager'>>((acc, employee) => {
            acc[employee.id] = employee.role;
            return acc;
          }, {}),
        );
      })
      .catch((err: unknown) => {
        const nextMessage =
          err instanceof ApiError ? err.message : 'Unable to load admin data';
        setError(nextMessage);
      })
      .finally(() => setIsAdminDataLoading(false));
  }, [profile.role]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile.name.trim()) {
      setError('Name is required');
      setMessage(null);
      return;
    }

    const raw = localStorage.getItem('auth_user');
    if (!raw) {
      setError('User session not found');
      setMessage(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser>;
      const updated = {
        ...parsed,
        name: profile.name.trim(),
      };
      localStorage.setItem('auth_user', JSON.stringify(updated));
      setMessage('Profile updated successfully.');
      setError(null);
      router.refresh();
    } catch {
      setError('Unable to update profile');
      setMessage(null);
    }
  }

  async function handleRoleUpdate(employee: EmployeeUser) {
    const nextRole = roleDrafts[employee.id] ?? employee.role;
    if (nextRole === employee.role) {
      return;
    }

    try {
      const updated = await inventoryApi.adminUpdateUserRole(employee.id, nextRole);
      setEmployees((prev) =>
        prev.map((row) => (row.id === updated.id ? { ...row, role: updated.role } : row)),
      );

      setRoleSummary((prev) => {
        const admins = employees.filter((row) => row.role === 'admin').length;
        const managers = employees.filter((row) => row.role === 'manager').length;
        const nextAdmins =
          employee.role === 'admin' && updated.role === 'manager'
            ? admins - 1
            : employee.role === 'manager' && updated.role === 'admin'
              ? admins + 1
              : admins;
        const nextManagers =
          employee.role === 'manager' && updated.role === 'admin'
            ? managers - 1
            : employee.role === 'admin' && updated.role === 'manager'
              ? managers + 1
              : managers;

        return prev.map((item) => {
          if (item.role === 'admin') {
            return { ...item, count: nextAdmins };
          }
          return { ...item, count: nextManagers };
        });
      });

      const rawUser = localStorage.getItem('auth_user');
      if (rawUser) {
        const currentUser = JSON.parse(rawUser) as AuthUser;
        if (currentUser.id === updated.id) {
          localStorage.setItem(
            'auth_user',
            JSON.stringify({ ...currentUser, role: updated.role }),
          );
          setProfile((prev) => ({ ...prev, role: updated.role }));
        }
      }

      setMessage(`Updated role for ${updated.name}`);
      setError(null);
    } catch (err) {
      const nextMessage =
        err instanceof ApiError ? err.message : 'Unable to update employee role';
      setError(nextMessage);
      setMessage(null);
    }
  }

  async function handleSeedReset() {
    setIsSeeding(true);
    try {
      const seeded = await inventoryApi.adminSeedReset();
      setMessage(
        `Seed complete: ${seeded.users} users, ${seeded.categories} categories, ${seeded.products} products, ${seeded.orders} orders.`,
      );
      setError(null);
    } catch (err) {
      const nextMessage =
        err instanceof ApiError ? err.message : 'Unable to run seed reset';
      setError(nextMessage);
      setMessage(null);
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <section className="space-y-4 border border-brand-line bg-white p-5">
      <h1 className="text-2xl font-semibold text-brand-ink">Settings</h1>
      <p className="text-sm text-brand-muted">Edit profile details used in this dashboard.</p>

      {message ? <p className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
        <div className="flex h-[120px] w-[120px] items-center justify-center border border-brand-line bg-brand-soft text-2xl font-semibold text-brand-ink">
          {initials}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="profileName" className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Name
            </label>
            <input
              id="profileName"
              value={profile.name}
              onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 w-full border border-brand-line px-3 py-2 text-sm"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label htmlFor="profileEmail" className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Email
            </label>
            <input
              id="profileEmail"
              value={profile.email}
              className="mt-1 w-full border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-muted"
              readOnly
            />
          </div>

          <div>
            <label htmlFor="profileRole" className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Role
            </label>
            <input
              id="profileRole"
              value={profile.role}
              className="mt-1 w-full border border-brand-line bg-brand-soft px-3 py-2 text-sm text-brand-muted capitalize"
              readOnly
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="border border-brand-line px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>
        </form>
      </div>

      {profile.role === 'admin' ? (
        <section className="space-y-4 border border-brand-line bg-brand-soft/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-brand-ink">Admin Controls</h2>
            <button
              type="button"
              onClick={handleSeedReset}
              disabled={isSeeding}
              className="border border-brand-line bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSeeding ? 'Seeding...' : 'Reset and Seed Data'}
            </button>
          </div>

          {isAdminDataLoading ? (
            <p className="text-sm text-brand-muted">Loading admin data...</p>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Role Table</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {roleSummary.map((item) => (
                    <div key={item.role} className="rounded-md border border-brand-line bg-white px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-brand-muted">{item.role}</p>
                      <p className="text-lg font-semibold text-brand-ink">{item.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">Employees Table</h3>
                <div className="rounded-md border border-brand-line bg-white">
                  <div className="grid grid-cols-[minmax(0,1fr)_220px_120px] items-center border-b border-brand-line bg-brand-soft px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    <span>Employee</span>
                    <span>Role</span>
                    <span>Action</span>
                  </div>
                  <div className="divide-y divide-brand-line">
                    {employees.map((employee) => (
                      <div key={employee.id} className="grid grid-cols-[minmax(0,1fr)_220px_120px] items-center px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brand-ink">{employee.name}</p>
                          <p className="truncate text-xs text-brand-muted">{employee.email}</p>
                        </div>
                        <select
                          value={roleDrafts[employee.id] ?? employee.role}
                          onChange={(event) =>
                            setRoleDrafts((prev) => ({
                              ...prev,
                              [employee.id]: event.target.value as 'admin' | 'manager',
                            }))
                          }
                          className="w-32 rounded-md border border-brand-line px-2 py-2 text-xs capitalize"
                        >
                          <option value="admin">admin</option>
                          <option value="manager">manager</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleRoleUpdate(employee)}
                          disabled={(roleDrafts[employee.id] ?? employee.role) === employee.role}
                          className="rounded-md border border-brand-line px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}
    </section>
  );
}
