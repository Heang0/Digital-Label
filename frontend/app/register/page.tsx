// app/register/page.tsx
'use client'; // <-- ADD THIS LINE AT THE TOP

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
  ArrowRight,
  Menu,
  X,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUp, logOut, db } from '@/lib/firebase';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSelector } from '@/components/admin/LanguageSelector';
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
import { createNotification } from '@/lib/notifications';

type PlanId = 'basic' | 'pro' | 'enterprise';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Company Info, 2: Plan Selection

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
        price: '$2/month',
        description: 'For small chains',
        features: ['Up to 5 branches', '1000 labels', 'Basic support'],
      },
      {
        id: 'pro' as const,
        name: 'Professional',
        price: '$10/month',
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

      await createNotification({
        companyId: 'admin',
        branchId: 'all',
        title: 'New Vendor Registration',
        message: `${formData.companyName} has registered and is pending approval.`,
        type: 'info'
      });

      await logOut();
      setIsLoading(false);
      router.push('/login?info=registered');
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-10">
      {/* Elite Background Blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-96 w-96 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-start pt-2 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5750F1] shadow-lg shadow-[#5750F1]/20 overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
              </div>
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-10 relative overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <LanguageSelector />
            </div>
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
               <motion.div 
                 initial={{ width: '50%' }}
                 animate={{ width: step === 1 ? '50%' : '100%' }}
                 className="h-full bg-[#5750F1] shadow-[0_0_10px_#5750F1]"
               />
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {step === 1 ? t('company_details') : t('select_plan')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {step === 1 
                  ? t('retail_business_desc') 
                  : t('plan_scale_desc')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('company_name')}</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="companyName" value={formData.companyName} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="Lucky Mart" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('full_name')}</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="fullName" value={formData.fullName} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="John Doe" required />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('email_addr')}</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="email" type="email" value={formData.email} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="contact@luckymart.com" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="phone" value={formData.phone} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="+855 12 345 678" required />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('address')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input name="address" value={formData.address} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="Phnom Penh, Cambodia" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('password')}</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="password" type="password" value={formData.password} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="********" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('confirm')}</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="pl-10 h-11 rounded-xl" placeholder="********" required />
                        </div>
                      </div>
                    </div>

                    <Button type="button" onClick={() => setStep(2)} className="w-full h-11 bg-blue-600 hover:bg-blue-700 mt-4">
                      {t('continue_to_plans')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {plans.map((p) => {
                        const selected = plan === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPlan(p.id)}
                            className={[
                              'relative flex flex-col items-center text-center rounded-2xl border p-4 transition-all duration-300',
                              selected
                                ? 'border-[#5750F1] bg-[#5750F1]/5 ring-2 ring-[#5750F1]/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            ].join(' ')}
                          >
                            {p.featured && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#5750F1] px-2 py-0.5 text-[8px] font-black uppercase text-white tracking-widest">
                                Popular
                              </span>
                            )}
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-1">{p.name}</h3>
                            <p className="text-lg font-black text-[#5750F1] mb-3">{p.price.split('/')[0]}</p>
                            <ul className="space-y-1.5 text-left w-full">
                              {p.features.slice(0, 3).map((f, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                                  <Check className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                                  <span className="truncate">{f}</span>
                                </li>
                              ))}
                            </ul>
                            {selected && (
                              <div className="mt-3 flex items-center justify-center h-5 w-5 rounded-full bg-[#5750F1] text-white">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 px-6">
                        {t('back')}
                      </Button>
                      <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20" isLoading={isLoading}>
                        {t('complete_registration')}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
               <p className="text-sm text-gray-600">
                  {t('already_account')}{' '}
                  <Link href="/login" className="font-bold text-[#5750F1] hover:underline">{t('sign_in_here')}</Link>
               </p>
               <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  {t('elite_infrastructure')}
               </p>
            </div>
          </div>

        </div>

        {/* Powered by — pinned to page bottom */}
        <div className="mt-auto pt-16 pb-6 flex flex-col items-center gap-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('powered_by')}</p>
          <div className="h-10 w-10 overflow-hidden rounded-xl shadow-md border border-white">
            <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <p className="text-[12px] font-black text-gray-900 uppercase tracking-[0.4em]">Kitzu-Tech</p>
        </div>
      </div>
    </div>
  );
}