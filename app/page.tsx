'use client';

// app/page.tsx
import Link from 'next/link';
import { useState } from 'react';
import { 
  ArrowRight, 
  Building2, 
  Smartphone, 
  Users, 
  BarChart3, 
  Shield,
  CheckCircle,
  Store,
  Clock,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';

// Animation variants with proper TypeScript types
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const floatAnimation: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-10, 10, -10],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: "easeInOut" as const 
    }
  }
};

const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.05, 1],
    transition: { 
      duration: 2, 
      repeat: Infinity, 
      ease: "easeInOut" as const 
    }
  }
};

const gradientAnimation: Variants = {
  initial: { backgroundPosition: "0% 50%" },
  animate: { 
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: { 
      duration: 10, 
      repeat: Infinity, 
      ease: "linear" as const 
    }
  }
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const features = [
    {
      icon: Building2,
      title: 'Multi-Store Management',
      description: 'Control all your retail branches from a single dashboard'
    },
    {
      icon: Smartphone,
      title: 'Real-Time Price Updates',
      description: 'Change prices across all stores instantly with one click'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Custom permissions for admin, head office, and store staff'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights with comprehensive sales and inventory reports'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Bank-level security with complete audit trails'
    },
    {
      icon: Clock,
      title: 'Smart Scheduling',
      description: 'Automate promotions and price changes with timers'
    }
  ];

  const useCases = [
    {
      industry: 'Supermarkets',
      description: 'Manage perishable goods pricing and evening discounts'
    },
    {
      industry: 'Electronics',
      description: 'Real-time price matching with competitors'
    },
    {
      industry: 'Fashion Retail',
      description: 'Seasonal sales and flash promotions management'
    },
    {
      industry: 'Hardware Stores',
      description: 'Multi-location inventory and pricing control'
    }
  ];

  return (
    <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
      {/* Navigation Bar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur"
      >
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Digital Label
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Use Cases', 'Pricing', 'Contact'].map((item, index) => (
                <motion.a
                  key={item}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                  href={`#${item.toLowerCase().replace(' ', '')}`}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
                </motion.a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link href="/login">
                  <Button variant="outline" size="sm" className="relative overflow-hidden group">
                    <span className="relative z-10">Sign In</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Link href="/register">
                  <Button size="sm" className="relative overflow-hidden group">
                    <span className="relative z-10">Get Started Free</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            {/* Mobile menu toggle */}
            <motion.button
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t bg-white overflow-hidden"
          >
            <div className="container mx-auto px-4 lg:px-10 max-w-6xl py-4 space-y-3">
              {['Features', 'Use Cases', 'Pricing', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '')}`}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="absolute inset-0">
          <motion.div 
            variants={floatAnimation}
            initial="initial"
            animate="animate"
            className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" 
          />
          <motion.div 
            variants={floatAnimation}
            initial="initial"
            animate="animate"
            transition={{ delay: 1 }}
            className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-slate-100 blur-2xl" 
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_45%)]" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl py-16 md:py-28 relative">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-wide">
                <Zap className="h-4 w-4 text-blue-300" />
                Retail pricing, unified in seconds
              </motion.div>

              <motion.h1 variants={fadeInUp} className="mt-6 text-4xl md:text-6xl font-semibold text-slate-900 leading-tight">
                A modern command center for digital shelf labels.
              </motion.h1>

              <motion.p variants={fadeInUp} className="mt-5 text-lg text-slate-600 max-w-xl">
                Push price updates, promos, and stock alerts to every aisle instantly. Keep teams aligned with
                real-time visibility across all stores.
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2 relative overflow-hidden group">
                    <span className="relative z-10 flex items-center">
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-slate-300 text-slate-900 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300">
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500"
              >
                {['Instant price sync', 'Branch-level control', 'Offline-safe labels'].map((tag, index) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="rounded-full border border-slate-200 px-3 py-1 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default"
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={slideInFromRight}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Live Price Broadcast</div>
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-emerald-600 font-medium flex items-center gap-1"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    Active
                  </motion.span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Lucky TTP', status: 'Synced', value: '+124 labels' },
                    { label: 'Lucky271', status: 'Syncing', value: '12 updates' },
                    { label: 'Downtown', status: 'Queued', value: '3 promos' },
                  ].map((row, index) => (
                    <motion.div
                      key={row.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{row.label}</span>
                        <span className="text-xs text-slate-500">{row.value}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <motion.span 
                          animate={{ 
                            backgroundColor: row.status === 'Syncing' 
                              ? ['#34d399', '#059669', '#34d399'] 
                              : row.status === 'Queued'
                                ? ['#fbbf24', '#d97706', '#fbbf24']
                                : '#34d399'
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-2 w-2 rounded-full"
                        />
                        {row.status}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div 
                  variants={pulseAnimation}
                  initial="initial"
                  animate="animate"
                  className="mt-6 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 text-xs text-slate-200 flex justify-between items-center"
                >
                  <span>Next sync window:</span>
                  <span className="font-mono">00:00:12</span>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-gray-900 to-slate-900 text-white py-16"
      >
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Retail Chains' },
              { value: '10K+', label: 'Store Branches' },
              { value: '2M+', label: 'Labels Managed' },
              { value: '99.9%', label: 'Uptime' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm"
              >
                <motion.div 
                  className="text-4xl font-bold mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Proof / Gallery Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <motion.div
              variants={slideInFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                See digital labels in real stores
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                Digital Label helps retailers update pricing in real time and keep shelves accurate—fast, clean,
                and consistent across every branch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {["Crisp shelf display", "Real-time adjustments", "Multi-store rollout", "Mobile-friendly ops"].map(
                  (tag, index) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default"
                    >
                      {tag}
                    </motion.span>
                  )
                )}
              </div>
            </motion.div>

            {/* 4 images - same size, responsive */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                {
                  src: 'https://theenterpriseworld.com/wp-content/uploads/2024/09/7-Dynamic-Pricing-in-Retail_-How-Electronic-Shelf-Labels-Enable-Real-Time-Adjustments-Source-enterpriseappstoday.com_.jpg',
                  alt: 'Electronic shelf labels in a retail aisle',
                },
                {
                  src: 'https://www.globalbrandsmagazine.com/wp-content/uploads/2025/02/Electronic-Shelf-Labels.webp',
                  alt: 'Electronic shelf label display close-up',
                },
                {
                  src: 'https://www.marketresearchintellect.com/images/blogs/retail-revolution-digital-shelf-labels-transforming-storefronts.webp',
                  alt: 'Digital shelf labels transforming store pricing',
                },
                {
                  src: 'https://www.electronicshelftags.com/wp-content/uploads/2025/08/digital-labels-fopr-clothing-4.png',
                  alt: 'Digital labels used in clothing retail',
                },
              ].map((img, index) => (
                <motion.div
                  key={img.src}
                  variants={scaleIn}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm group"
                >
                  <div className="relative h-48 w-full sm:h-56 md:h-64 overflow-hidden">
                    <motion.img
                      src={img.src}
                      alt={img.alt}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      initial={{ scale: 1.1 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.8 }}
                      viewport={{ once: true }}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Retail
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage digital price labels across your entire retail chain
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.3 }}
                className="card p-8 hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 bg-white"
              >
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 mb-6"
                >
                  <feature.icon className="h-6 w-6" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

                    {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple 4-step process to transform your price management
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection lines */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" as const }}
              viewport={{ once: true }}
              className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Register Your Chain',
                  description: 'Sign up and create your retail chain profile'
                },
                {
                  step: '2',
                  title: 'Add Your Stores',
                  description: 'Create branches and import your products'
                },
                {
                  step: '3',
                  title: 'Connect Labels',
                  description: 'Register digital labels to each product'
                },
                {
                  step: '4',
                  title: 'Update Prices Instantly',
                  description: 'Change prices from dashboard, labels update in seconds'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center relative"
                >
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold mb-4 mx-auto relative z-10"
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industry Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Perfect solution for various retail businesses
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ 
                  x: 10,
                  boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.1)"
                }}
                transition={{ duration: 0.3 }}
                className="card p-8 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {useCase.industry}
                    </h3>
                    <p className="text-gray-600">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple plans for single stores to large retail chains.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                name: 'Starter',
                price: '$0',
                note: 'Perfect for trying the platform',
                items: ['1 store', 'Basic label sync', 'Email support'],
                cta: 'Start Free',
                href: '/register',
                highlight: false,
              },
              {
                name: 'Growth',
                price: '$29',
                note: 'For growing retail teams',
                items: ['Up to 10 stores', 'Role permissions', 'Promotions & scheduling'],
                cta: 'Get Started',
                href: '/register',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                note: 'For large chains & integrations',
                items: ['Unlimited stores', 'SLA & onboarding', 'Custom integrations'],
                cta: 'Contact Sales',
                href: '#contact',
                highlight: false,
              },
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={scaleIn}
                whileHover={{ y: -15 }}
                transition={{ duration: 0.3 }}
                className={[
                  'rounded-3xl border bg-white p-8 shadow-sm transition-all duration-300',
                  plan.highlight ? 'border-blue-600 ring-4 ring-blue-100 relative' : 'border-gray-200',
                ].join(' ')}
              >
                {plan.highlight && (
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    <span className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                      Popular
                    </span>
                  </motion.div>
                )}
                
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-gray-600">{plan.note}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-bold text-gray-900">{plan.price}</div>
                    {plan.price !== 'Custom' && <div className="text-sm text-gray-500">/mo</div>}
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  {plan.items.map((it, idx) => (
                    <motion.li
                      key={it}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                      <span>{it}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-8">
                  <Link href={plan.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        className={[
                          'w-full relative overflow-hidden group',
                          plan.highlight ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-slate-900 to-slate-800'
                        ].join(' ')}
                      >
                        <span className="relative z-10">{plan.cta}</span>
                        <span className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-10 text-center text-sm text-gray-500"
          >
            Need help choosing a plan?{' '}
            <a href="#contact" className="font-medium text-blue-600 hover:underline">
              Talk to us
            </a>
            .
          </motion.p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div
              variants={slideInFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Contact</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                Want a demo or enterprise pricing? Send us a message and we'll get back quickly.
              </p>
              <div className="mt-6 space-y-3 text-sm text-gray-700">
                {[
                  'Fast onboarding support',
                  'Training for staff & vendors',
                  'Integration options (POS, inventory)'
                ].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-lg"
            >
              <form className="space-y-4">
                {[
                  { label: 'Name', placeholder: 'Your name', type: 'text' },
                  { label: 'Email', placeholder: 'you@company.com', type: 'email' },
                  { label: 'Message', placeholder: 'Tell us what you need...', type: 'textarea' }
                ].map((field, index) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <label className="text-sm font-medium text-gray-700">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="mt-2 min-h-[120px] w-full rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        placeholder={field.placeholder}
                      />
                    )}
                  </motion.div>
                ))}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button type="button" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700">
                    Send message
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" as const },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
          }}
          className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" as const },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
          }}
          className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl text-center relative z-10">
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Transform Your Retail Operations?
          </motion.h2>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto"
          >
            Join hundreds of retail chains already using Digital Label Pro
          </motion.p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2 shadow-lg">
                  <span className="flex items-center">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-white border-white bg-white/10 hover:bg-white/20 shadow-lg">
                  Schedule Demo
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-gradient-to-b from-gray-900 to-slate-900 text-gray-400 py-12"
      >
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Digital Label
                </span>
              </div>
              <p className="text-sm">
                Central control for your chain stores. Digital price label management made simple.
              </p>
            </motion.div>

            {[
              {
                title: 'Product',
                links: ['Features', 'Pricing', 'Use Cases', 'Demo']
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact']
              },
              {
                title: 'Legal',
                links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR']
              }
            ].map((column, colIndex) => (
              <motion.div
                key={column.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: colIndex * 0.1 + 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-white font-semibold mb-4">{column.title}</h3>
                <ul className="space-y-2 text-sm">
                  {column.links.map((link, linkIndex) => (
                    <motion.li
                      key={link}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: linkIndex * 0.05 + colIndex * 0.1 + 0.3 }}
                      viewport={{ once: true }}
                    >
                      <a 
                        href={link === 'Demo' ? '/login' : `#${link.toLowerCase().replace(' ', '')}`} 
                        className="hover:text-white transition-colors duration-300 hover:pl-2 block"
                      >
                        {link}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            viewport={{ once: true }}
            className="border-t border-gray-800 mt-8 pt-8 text-center text-sm"
          >
            <p>© 2026 Digital Label. All rights reserved to Kimmy and Her Bf.</p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}