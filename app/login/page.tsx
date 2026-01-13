'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, 
  Mail, 
  Store, 
  AlertCircle,
  Building2,
  Users,
  ArrowRight
} from 'lucide-react';
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
  color: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<string>('');

  // Demo accounts - NO ADMIN
  const demoAccounts: DemoAccount[] = [
    {
      email: 'demo@digital-label.com',
      password: 'demopassword123',
      role: 'vendor',
      name: 'Vendor Demo',
      icon: <Building2 className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      email: 'staff.demo@store.com',
      password: 'staffdemo123',
      role: 'staff',
      name: 'Staff Demo',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-500'
    }
  ];

  // Auto-fill demo credentials
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
      console.log('Attempting login with:', email);
      
      // 1. Sign in with Firebase
      const userCredential = await signIn(email, password);
      console.log('✅ Firebase login successful:', userCredential.user.email);
      
      // 2. Get user data from Firestore
      const userData = await getUserData(userCredential.user.uid);
      
      if (!userData) {
        throw new Error('User data not found in database');
      }
      
      console.log('✅ User data loaded:', userData);
      
      // 3. Store user in Zustand store (persists)
      setUser(userData);
      
      // 4. Redirect based on role
      if (userData.role === 'admin') {
        router.push('/admin');
      } else if (userData.role === 'vendor') {
        router.push('/vendor');
      } else if (userData.role === 'staff') {
        router.push('/staff');
      } else {
        router.push('/vendor'); // Default
      }
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      
      // User-friendly error messages
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/configuration-not-found') {
        setError('Firebase not configured. Please contact support.');
      } else {
        setError(error.message || 'Failed to sign in. Please check your credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Label</h1>
          <p className="text-gray-600 mt-2">Central Control for Your Chain Stores</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Login Failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Simple Demo Boxes */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Try Demo:</p>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  onClick={() => selectDemo(account)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDemo === account.role
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`${account.color} p-2 rounded-lg mb-2`}>
                      {account.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{account.name}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {selectedDemo === account.role ? '✓ Selected' : 'Click to select'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
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
                  }}
                  className="pl-10"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Contact sales
              </Link>
            </div>
          </form>
        </div>

        {/* Admin Notice */}
        <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Note:</span> Admin access requires special permissions.
            Demo accounts are for testing vendor and staff features only.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2024 Digital Label. All rights reserved.
        </p>
      </div>
    </div>
  );
}