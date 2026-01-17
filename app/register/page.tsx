// app/register/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
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
  Sparkles,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUp, logOut, db } from '@/lib/firebase';
import { 
  doc, 
  setDoc, 
  Timestamp, 
  query, 
  collection, 
  getDocs, 
  where
} from 'firebase/firestore';
import { makeVendorCode, nextGlobalSequence } from '@/lib/id-generator';
import { motion } from 'framer-motion';

type PlanId = 'basic' | 'pro' | 'enterprise';

export default function RegisterPage() {
  const router = useRouter();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email.toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setIsLoading(false);
        alert(`❌ An account with email ${formData.email} already exists!`);
        return;
      }

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50/20">
      {/* Enhanced Sticky Navigation Bar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo with animation */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.2
              }}
              className="flex items-center gap-2 group"
            >
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute -inset-1 rounded-xl border-2 border-blue-400/30"
                />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
              >
                Digital Label
              </motion.span>
              <motion.span
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700"
              >
                PRO
              </motion.span>
            </motion.div>

            {/* Desktop Navigation - FIXED LINKS */}
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'Use Cases', 'Pricing', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: index * 0.1 + 0.4,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  href={`/#${item.toLowerCase().replace(' ', '')}`}
                  className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group"
                >
                  <span className="relative z-10">{item}</span>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    whileHover={{ scale: 1.05 }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"
                    initial={false}
                    whileHover={{ width: "100%" }}
                  />
                </motion.a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.7,
                  type: "spring",
                  stiffness: 150,
                  damping: 15
                }}
              >
                <Link href="/">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="relative overflow-hidden group border-gray-300 hover:border-blue-400"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <ArrowLeft className="h-3 w-3" />
                        Back to Home
                      </span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: 0.8,
                  type: "spring",
                  stiffness: 150,
                  damping: 15
                }}
              >
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="sm" 
                      className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/40"
                    >
                      <span className="relative z-10 flex items-center gap-2 text-white">
                        Sign In
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
            
            {/* Mobile menu toggle */}
            <motion.button
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              type="button"
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-300 text-gray-700 shadow-sm hover:border-gray-400"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
              whileTap={{ scale: 0.9 }}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        {/* Mobile Menu - FIXED LINKS */}
        {mobileNavOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-1">
                {['Features', 'Use Cases', 'Pricing', 'Contact'].map((item, index) => (
                  <motion.a
                    key={item}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    href={`/#${item.toLowerCase().replace(' ', '')}`}
                    onClick={() => setMobileNavOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                <Link href="/">
                  <Button variant="outline" size="sm" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-blue-700">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Add padding-top to account for fixed navbar */}
      <div className="pt-16">
        <main className="container mx-auto px-4 lg:px-8 max-w-7xl py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-6xl"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Create Your Digital Label Account
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Join hundreds of retail chains already using our platform
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
              {/* Left column: form */}
              <motion.section
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
              >
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
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
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
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Full Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-2"
                  >
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
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-2"
                  >
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
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Phone */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="space-y-2"
                  >
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
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </motion.div>

                  {/* Address */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
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
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </motion.div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="space-y-2"
                    >
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
                          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-2"
                    >
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
                          className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                    className="pt-2"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        isLoading={isLoading}
                      >
                        <span className="flex items-center gap-2">
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </motion.div>

                    <p className="mt-4 text-center text-sm text-gray-600">
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </motion.div>
                </form>
              </motion.section>

              {/* Right column: plan selection */}
              <motion.aside
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
                >
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                      Select Your Plan
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      You can change plans anytime after approval.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {plans.map((p, index) => {
                      const selected = plan === p.id;
                      return (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          type="button"
                          onClick={() => setPlan(p.id)}
                          className={`w-full text-left rounded-2xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            selected
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'bg-white hover:border-blue-300 hover:shadow-md'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-gray-900">
                                  {p.name}
                                </h3>
                                {p.featured && (
                                  <motion.span
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-0.5 text-xs font-medium text-white shadow-sm"
                                  >
                                    Popular
                                  </motion.span>
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
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Selected
                                </motion.div>
                              )}
                            </div>
                          </div>

                          <ul className="mt-4 space-y-2">
                            {p.features.map((feature, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                                <span>{feature}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.section>

                {/* Benefits */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8"
                >
                  <h3 className="text-base font-semibold text-gray-900">
                    Why Choose Digital Label?
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {[
                      '14-day free trial',
                      'No credit card required',
                      'Cancel anytime',
                      '24/7 customer support',
                    ].map((t, index) => (
                      <motion.li
                        key={t}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <motion.span
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100"
                        >
                          <span className="text-green-700">
                            <Check className="h-4 w-4" />
                          </span>
                        </motion.span>
                        <span className="text-sm text-gray-700">{t}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="text-xs leading-relaxed text-gray-600">
                      By creating an account, you agree to our terms and acknowledge that your
                      company may be reviewed before activation.
                    </p>
                  </motion.div>
                </motion.section>
              </motion.aside>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}