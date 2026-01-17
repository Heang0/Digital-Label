'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Building2, Lock, Mail, Store, Users } from 'lucide-react';
import {
  signIn,
  signInWithGoogle,
  getGoogleRedirectResult,
  ensureUserDoc,
  getUserData,
  linkPendingCredentialToCurrentUser,
  sendPasswordReset,
} from '@/lib/firebase';
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

function GoogleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.649 32.659 29.172 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.945 6.053 29.727 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.945 6.053 29.727 4 24 4c-7.682 0-14.31 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.061 0 9.782-1.94 13.292-5.092l-6.131-5.189C29.109 35.509 26.715 36 24 36c-5.151 0-9.616-3.317-11.287-7.946l-6.52 5.023C9.534 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.213-2.231 4.082-4.142 5.241l.003-.002 6.131 5.189C36.86 39.37 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
      />
    </svg>
  );
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<'vendor' | 'staff' | ''>('');

  // Reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Used when a user tries Google sign-in but the email already has a password account.
  const [pendingCredential, setPendingCredential] = useState<any>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');

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

  // Complete Google redirect sign-in (for browsers that block popups).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getGoogleRedirectResult();
        if (!mounted || !result?.user) return;

        setError('');
        setInfo('');
        setIsLoading(true);

        await ensureUserDoc({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
        });

        const userData = await getUserData(result.user.uid);
        if (!userData) throw new Error('User data not found in database');
        setUser(userData);

        const nextPath = searchParams.get('next');
        if (nextPath && nextPath.startsWith('/')) router.push(nextPath);
        else if (userData.role === 'admin') router.push('/admin');
        else if (userData.role === 'vendor') router.push('/vendor');
        else if (userData.role === 'staff') router.push('/staff');
        else router.push('/vendor');
      } catch (e: any) {
        // If there's no redirect result, Firebase may throw/return null depending on version.
        // Only show an error for real issues.
        if (e?.code && e.code !== 'auth/no-auth-event') {
          setError(e?.message || 'Google sign-in failed.');
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(account.role);
    setError('');
    setInfo('');
    setPendingCredential(null);
    setPendingEmail('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      const userCredential = await signIn(email, password);

      // If the user previously tried Google and we have a pending credential, link it now.
      if (pendingCredential) {
        await linkPendingCredentialToCurrentUser(pendingCredential);
        setPendingCredential(null);
        setPendingEmail('');
      }

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

  const handleGoogleLogin = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();

      // If popup was blocked, we started a redirect flow.
      // Firebase will take over navigation; we'll complete the login on return via getGoogleRedirectResult().
      if (!result) {
        setInfo('Redirecting to Google sign-in...');
        return;
      }
      await ensureUserDoc({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });

      const userData = await getUserData(result.user.uid);
      if (!userData) throw new Error('User data not found in database');
      setUser(userData);

      const nextPath = searchParams.get('next');
      if (nextPath && nextPath.startsWith('/')) router.push(nextPath);
      else if (userData.role === 'admin') router.push('/admin');
      else if (userData.role === 'vendor') router.push('/vendor');
      else if (userData.role === 'staff') router.push('/staff');
      else router.push('/vendor');
    } catch (error: any) {
      // Firebase will block creating a second account with the same email.
      // In that case we ask the user to sign in with password once, then we link Google to that account.
      if (error?.code === 'auth/account-exists-with-different-credential') {
        setPendingEmail(error?.customData?.email || '');
        setPendingCredential(error?.credential || null);
        setInfo(
          'This email already has a password account. Please sign in with your password once to link Google login.'
        );
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in was cancelled.');
      } else if (error?.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups or try again.');
      } else {
        setError(error?.message || 'Failed to sign in with Google.');
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Open modal and pre-fill with whatever email we have
    setError('');
    setInfo('');
    setResetEmail((email || pendingEmail || '').trim());
    setResetOpen(true);
  };

  const handleSendReset = async () => {
    setError('');
    setInfo('');
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      setError('Please enter your email to receive a reset link.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordReset(targetEmail);
      setInfo('Reset link sent. Please check your email inbox (and spam).');
      setResetOpen(false);
    } catch (error: any) {
      if (error?.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (error?.code === 'auth/invalid-email') setError('Invalid email address.');
      else setError(error?.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="w-full max-w-md">
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

            {info && (
              <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">Info</p>
                <p className="mt-1 text-sm text-blue-800">{info}</p>
              </div>
            )}

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

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
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

          <p className="mt-6 text-center text-xs text-gray-500">© 2026 Digital Label. All rights reserved.</p>
        </div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reset password</h3>
            <p className="mt-1 text-sm text-gray-600">
              Enter the email you used to register. We’ll send a reset link.
            </p>

            <div className="mt-4 space-y-2">
              <label htmlFor="resetEmail" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="resetEmail"
                type="email"
                placeholder="you@gmail.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetOpen(false)}
                disabled={resetLoading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSendReset} disabled={resetLoading}>
                {resetLoading ? 'Sending…' : 'Send reset link'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
