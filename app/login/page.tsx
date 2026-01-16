'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Building2, Lock, Mail, Store, Users } from 'lucide-react';
import { signIn, getUserData } from '@/lib/firebase';
import { useUserStore } from '@/lib/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DemoAccount = {
  email: string;
  password: string;
  role: 'vendor' | 'staff';
  name: string;
  icon: React.ReactNode;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<'vendor' | 'staff' | ''>('');

  // Keep your main blue theme (same vibe as your original)
  const demoAccounts: DemoAccount[] = useMemo(
    () => [
      {
        email: 'demo@digital-label.com',
        password: 'demopassword123',
        role: 'vendor',
        name: 'Vendor Demo',
        icon: <Building2 className="h-4 w-4" />,
      },
      {
        email: 'staff.demo@store.com',
        password: 'staffdemo123',
        role: 'staff',
        name: 'Staff Demo',
        icon: <Users className="h-4 w-4" />,
      },
    ],
    []
  );

  const selectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(account.role);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signIn(email, password);
      const userData = await getUserData(userCredential.user.uid);

      if (!userData) throw new Error('User data not found in database');

      const isDemoStaff = selectedDemo === 'staff' || userData.email === 'staff.demo@store.com';
      const normalizedUser = isDemoStaff
        ? {
            ...userData,
            permissions: {
              canViewProducts: true,
              canUpdateStock: true,
              canReportIssues: true,
              canViewReports: true,
              canChangePrices: true,
              canCreateProducts: true,
              canCreateLabels: true,
              canCreatePromotions: true,
              maxPriceChange: 0,
            },
          }
        : userData;

      setUser(normalizedUser);

      const nextPath = searchParams.get('next');
      if (nextPath && nextPath.startsWith('/')) {
        router.push(nextPath);
      } else if (normalizedUser.role === 'admin') {
        router.push('/admin');
      } else if (normalizedUser.role === 'vendor') {
        router.push('/vendor');
      } else if (normalizedUser.role === 'staff') {
        router.push('/staff');
      } else {
        router.push('/vendor');
      }
    } catch (error: any) {
      setIsLoading(false);

      if (error.code === 'auth/invalid-credential') setError('Invalid email or password. Please try again.');
      else if (error.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (error.code === 'auth/wrong-password') setError('Incorrect password. Please try again.');
      else if (error.code === 'auth/too-many-requests')
        setError('Too many failed attempts. Please try again later.');
      else if (error.code === 'auth/configuration-not-found')
        setError('Firebase not configured. Please contact support.');
      else setError(error.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-10">
      {/* Background accents (blue theme, subtle) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        {/* Single centered card for best responsiveness */}
        <div className="w-full max-w-md">
          {/* Logo only (removed the text you requested) */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm">
              <Store className="h-7 w-7 text-white" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-1 text-sm text-gray-600">Welcome back. Please enter your details.</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-red-100 p-2">
                    <AlertCircle className="h-4 w-4 text-red-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800">Login failed</p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo accounts (compact + responsive) */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700">Try demo</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {demoAccounts.map((account) => {
                  const active = selectedDemo === account.role;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => selectDemo(account)}
                      className={[
                        'group flex items-center justify-between rounded-xl border p-3 text-left transition',
                        active
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={[
                            'flex h-9 w-9 items-center justify-center rounded-lg',
                            active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
                          ].join(' ')}
                        >
                          {account.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
                          <p className="text-xs text-gray-500">{active ? 'Selected' : 'Click to use'}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                      setSelectedDemo('');
                    }}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                      setSelectedDemo('');
                    }}
                    className="h-11 pl-10"
                    required
                  />
                </div>
              </div>

              {/* Button */}
              <Button
                type="submit"
                className="h-11 w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Links row (responsive) */}
              <div className="flex flex-col gap-2 pt-1 text-sm text-center sm:items-center">
                <p className="text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-medium text-blue-600 hover:underline">
                    Register Now
                  </Link>
                </p>

              </div>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            © 2026 Digital Label. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
