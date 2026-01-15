// app/register/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Store,
  ArrowLeft,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { Inter } from 'next/font/google';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUp, logOut, db } from '@/lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { makeVendorCode, nextGlobalSequence } from '@/lib/id-generator';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

type PlanId = 'basic' | 'pro' | 'enterprise';

export default function RegisterPage() {
  const router = useRouter();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlanId>('pro');

  const plans = useMemo(
    () => [
      {
        id: 'basic' as const,
        name: 'Basic',
        price: '$99/month',
        description: 'For small chains',
        features: ['Up to 5 branches', '1000 labels', 'Basic support'],
      },
      {
        id: 'pro' as const,
        name: 'Professional',
        price: '$299/month',
        description: 'For growing chains',
        features: [
          'Up to 20 branches',
          '5000 labels',
          'Priority support',
          'Advanced analytics',
        ],
        featured: true,
      },
      {
        id: 'enterprise' as const,
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large enterprises',
        features: [
          'Unlimited branches',
          'Unlimited labels',
          '24/7 support',
          'Custom features',
        ],
      },
    ],
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const companySeq = await nextGlobalSequence('nextCompanyNumber');
      const vendorCode = makeVendorCode(companySeq);

      const userCredential = await signUp(formData.email, formData.password);
      const userId = userCredential.user.uid;
      const companyId = `company_${userId}`;

      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: formData.email,
        name: formData.fullName,
        role: 'vendor',
        companyId,
        status: 'pending',
        createdAt: Timestamp.now(),
        phone: formData.phone,
        createdBy: 'self-register',
      });

      await setDoc(doc(db, 'companies', companyId), {
        id: companyId,
        code: vendorCode,
        name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        contactPerson: formData.fullName,
        subscription: plan,
        status: 'pending',
        ownerId: userId,
        ownerName: formData.fullName,
        createdAt: Timestamp.now(),
        createdBy: 'self-register',
      });

      await logOut();
      setIsLoading(false);
      router.push('/login');
    } catch (error: any) {
      console.error('Error registering vendor:', error);
      alert(error?.message || 'Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className={inter.className}>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-gray-100">
        {/* Top navigation */}
        <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
                <Store className="h-5 w-5 text-white" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-gray-900">
                Digital Label
              </span>
            </Link>

            {/* Desktop actions */}
            <nav className="hidden items-center gap-2 sm:flex">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Open menu"
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                {mobileNavOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileNavOpen && (
            <div className="border-t bg-white sm:hidden">
              <div className="mx-auto max-w-6xl px-4 py-3">
                <div className="grid gap-2">
                  <Link href="/" onClick={() => setMobileNavOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileNavOpen(false)}>
                    <Button className="w-full justify-start">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <div className="mx-auto max-w-4xl">

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
              {/* Left column: form */}
              <section className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                    Company Information
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Create your vendor account. Your company will be reviewed before activation.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        name="companyName"
                        placeholder="Your retail chain name"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        name="fullName"
                        placeholder="Your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Business Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="contact@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        name="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Business Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        name="address"
                        placeholder="123 Business St, City, State, ZIP"
                        value={formData.address}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          name="password"
                          type="password"
                          placeholder="********"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Confirm <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="********"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                      Create Account
                    </Button>

                    <p className="mt-4 text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </section>

              {/* Right column: plan selection */}
              <aside className="space-y-6">
                <section className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                      Select Your Plan
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      You can change plans anytime after approval.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {plans.map((p) => {
                      const selected = plan === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlan(p.id)}
                          className={[
                            'w-full text-left rounded-2xl border p-4 transition-all',
                            'focus:outline-none focus:ring-2 focus:ring-blue-500',
                            selected
                              ? 'border-blue-500 bg-blue-50'
                              : 'bg-white hover:border-gray-300',
                          ].join(' ')}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {p.name}
                                </h3>
                                {p.featured && (
                                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                                    Popular
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {p.description}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {p.price}
                              </div>
                              {selected && (
                                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                                  <Check className="h-3.5 w-3.5" />
                                  Selected
                                </div>
                              )}
                            </div>
                          </div>

                          <ul className="mt-4 space-y-2">
                            {p.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Benefits */}
                <section className="rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur sm:p-8">
                  <h3 className="text-base font-semibold text-gray-900">
                    Why Choose LabelSync Pro?
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {[
                      '14-day free trial',
                      'No credit card required',
                      'Cancel anytime',
                      '24/7 customer support',
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <span className="text-green-700">
                            <Check className="h-4 w-4" />
                          </span>
                        </span>
                        <span className="text-sm text-gray-700">{t}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-xl border bg-white p-4">
                    <p className="text-xs leading-relaxed text-gray-600">
                      By creating an account, you agree to our terms and acknowledge that your
                      company may be reviewed before activation.
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
