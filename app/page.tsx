'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  Zap,
  Sparkles,
  ChevronRight,
  BadgeCheck,
  CloudLightning,
  Lock,
  RefreshCw,
  Calendar,
  Package,
  Tag,
  Settings,
  Server,
  Database,
  Cpu,
  Wifi,
  ShieldCheck,
  Globe,
  Target,
  TrendingUp,
  Headphones,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';

// Enhanced animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1],
      delay: 0.1
    }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const scaleIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    filter: "blur(0px)",
    transition: { 
      duration: 0.6, 
      ease: "backOut"
    }
  }
};

const slideInFromRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 100,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const slideInFromLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -100,
    filter: "blur(10px)"
  },
  visible: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.8, 
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const floatAnimation: Variants = {
  initial: { y: 0 },
  animate: { 
    y: [-20, 20, -20],
    transition: { 
      duration: 6, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  }
};

const pulseAnimation: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.08, 1],
    transition: { 
      duration: 3, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }
  }
};

const glowAnimation: Variants = {
  initial: { boxShadow: "0 0 0px rgba(59, 130, 246, 0)" },
  animate: {
    boxShadow: [
      "0 0 0px rgba(59, 130, 246, 0)",
      "0 0 30px rgba(59, 130, 246, 0.6)",
      "0 0 0px rgba(59, 130, 246, 0)"
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const bounceSoft: Variants = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      mass: 0.8
    }
  }
};

const typingEffect: Variants = {
  hidden: { width: "0%", opacity: 0 },
  visible: {
    width: "100%",
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: "easeInOut"
    }
  }
};

const rotate3D: Variants = {
  hidden: { 
    opacity: 0,
    rotateX: 90,
    rotateY: 90 
  },
  visible: {
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    transition: {
      duration: 1,
      ease: "backOut"
    }
  }
};

const waveAnimation: Variants = {
  animate: {
    x: ["0%", "100%"],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 20,
        ease: "linear"
      }
    }
  }
};

const shimmerAnimation: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const features = [
    {
      icon: Building2,
      title: 'Multi-Store Management',
      description: 'Control all your retail branches from a single dashboard',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600',
      delay: 0
    },
    {
      icon: RefreshCw,
      title: 'Real-Time Price Updates',
      description: 'Change prices across all stores instantly with one click',
      color: 'from-emerald-500/20 to-emerald-600/20',
      iconColor: 'text-emerald-600',
      delay: 0.1
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Custom permissions for admin, head office, and store staff',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600',
      delay: 0.2
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Get insights with comprehensive sales and inventory reports',
      color: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-600',
      delay: 0.3
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Compliant',
      description: 'Bank-level security with complete audit trails',
      color: 'from-rose-500/20 to-rose-600/20',
      iconColor: 'text-rose-600',
      delay: 0.4
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Automate promotions and price changes with timers',
      color: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-600',
      delay: 0.5
    }
  ];

  const useCases = [
    {
      industry: 'Supermarkets',
      description: 'Manage perishable goods pricing and evening discounts',
      icon: Package,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      delay: 0
    },
    {
      industry: 'Electronics',
      description: 'Real-time price matching with competitors',
      icon: Smartphone,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      delay: 0.1
    },
    {
      industry: 'Fashion Retail',
      description: 'Seasonal sales and flash promotions management',
      icon: Tag,
      iconColor: 'text-pink-600',
      bgColor: 'bg-pink-50',
      delay: 0.2
    },
    {
      industry: 'Hardware Stores',
      description: 'Multi-location inventory and pricing control',
      icon: Settings,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      delay: 0.3
    }
  ];

  const capabilities = [
    { label: 'Instant Sync', icon: CloudLightning, delay: 0 },
    { label: 'Secure', icon: Lock, delay: 0.1 },
    { label: 'Analytics', icon: BarChart3, delay: 0.2 }
  ];

  const stats = [
    { value: '500+', label: 'Retail Chains', icon: Building2, delay: 0 },
    { value: '10K+', label: 'Store Branches', icon: Store, delay: 0.1 },
    { value: '2M+', label: 'Labels Managed', icon: Database, delay: 0.2 },
    { value: '99.9%', label: 'Uptime', icon: BadgeCheck, delay: 0.3 }
  ];

  const steps = [
    {
      step: '1',
      title: 'Register Your Chain',
      description: 'Sign up and create your retail chain profile',
      icon: Store,
      delay: 0
    },
    {
      step: '2',
      title: 'Add Your Stores',
      description: 'Create branches and import your products',
      icon: Building2,
      delay: 0.1
    },
    {
      step: '3',
      title: 'Connect Labels',
      description: 'Register digital labels to each product',
      icon: Server,
      delay: 0.2
    },
    {
      step: '4',
      title: 'Update Prices Instantly',
      description: 'Change prices from dashboard, labels update in seconds',
      icon: RefreshCw,
      delay: 0.3
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: '$0',
      note: 'Perfect for trying the platform',
      items: ['1 store', 'Basic label sync', 'Email support'],
      cta: 'Start Free',
      href: '/register',
      highlight: false,
      delay: 0
    },
    {
      name: 'Growth',
      price: '$29',
      note: 'For growing retail teams',
      items: ['Up to 10 stores', 'Role permissions', 'Promotions & scheduling'],
      cta: 'Get Started',
      href: '/register',
      highlight: true,
      delay: 0.1
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'For large chains & integrations',
      items: ['Unlimited stores', 'SLA & onboarding', 'Custom integrations'],
      cta: 'Contact Sales',
      href: '#contact',
      highlight: false,
      delay: 0.2
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50/20 scroll-smooth overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          variants={floatAnimation}
          initial="initial"
          animate="animate"
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-100/40 to-blue-50/30 rounded-full blur-3xl"
        />
        <motion.div
          variants={floatAnimation}
          initial="initial"
          animate="animate"
          transition={{ delay: 2 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-emerald-100/20 to-emerald-50/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 right-1/3 w-64 h-64 border border-blue-200/20 rounded-full"
        />
      </div>

      {/* Fixed Sticky Navigation Bar */}
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

            {/* Desktop Navigation with animations */}
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
                  href={`#${item.toLowerCase().replace(' ', '')}`}
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

            {/* CTA Buttons with animations */}
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
                <Link href="/login">
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
                        Sign In
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <motion.div
                        variants={shimmerAnimation}
                        initial="initial"
                        animate="animate"
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
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
                <Link href="/register">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="sm" 
                      className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/40"
                    >
                      <span className="relative z-10 flex items-center gap-2 text-white">
                        Get Started
                        <Sparkles className="h-3 w-3" />
                      </span>
                      <motion.span
                        variants={glowAnimation}
                        initial="initial"
                        animate="animate"
                        className="absolute inset-0 rounded-lg"
                      />
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
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              whileTap={{ scale: 0.9 }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
        
        {/* Mobile Menu with animation */}
        {mobileOpen && (
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
                    href={`#${item.toLowerCase().replace(' ', '')}`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {item}
                  </motion.a>
                ))}
              </div>
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-blue-700">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Add padding-top to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section with enhanced animations */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/30 via-white to-white">
          <div className="absolute inset-0">
            <motion.div 
              variants={floatAnimation}
              initial="initial"
              animate="animate"
              className="absolute -top-40 -right-20 h-96 w-96 rounded-full bg-gradient-to-r from-blue-200/40 to-blue-100/30 blur-3xl" 
            />
            <motion.div 
              variants={floatAnimation}
              initial="initial"
              animate="animate"
              transition={{ delay: 3 }}
              className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-gradient-to-r from-emerald-200/20 to-emerald-100/20 blur-3xl" 
            />
          </div>
          
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-20 md:py-32 relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  variants={scaleIn}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 border border-blue-200"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4 text-blue-600" />
                  </motion.div>
                  <span className="text-sm font-semibold text-blue-700">
                    Retail pricing, unified in seconds
                  </span>
                </motion.div>

                <motion.h1 
                  variants={typingEffect}
                  initial="hidden"
                  animate="visible"
                  className="mt-8 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                >
                  A modern command center for digital shelf labels.
                </motion.h1>

                <motion.p 
                  variants={fadeInUp}
                  className="mt-6 text-lg text-gray-600 max-w-xl"
                >
                  Push price updates, promos, and stock alerts to every aisle instantly. Keep teams aligned with
                  real-time visibility across all stores.
                </motion.p>

                <motion.div 
                  variants={fadeInUp}
                  className="mt-10 flex flex-col sm:flex-row gap-4"
                >
                  <Link href="/register">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button size="lg" className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl shadow-blue-500/40">
                        <span className="relative z-10 flex items-center gap-2 text-white">
                          Start Free Trial
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
                        </span>
                        <motion.span
                          variants={glowAnimation}
                          initial="initial"
                          animate="animate"
                          className="absolute inset-0 rounded-lg"
                        />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/login">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600"
                      >
                        Watch Demo
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.div 
                  variants={fadeInUp}
                  className="mt-12 flex flex-wrap gap-3"
                >
                  {capabilities.map((cap, index) => (
                    <motion.div
                      key={cap.label}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                        className="p-1.5 rounded-md bg-blue-50"
                      >
                        <cap.icon className="h-4 w-4 text-blue-600" />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-700">{cap.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Dashboard Card with 3D animation */}
              <motion.div
                variants={rotate3D}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-blue-50 rounded-3xl blur-xl opacity-50" />
                <motion.div
                  whileHover={{ y: -10, rotateX: 5 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-3xl bg-white border border-gray-200 p-8 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center"
                      >
                        <Cpu className="h-5 w-5 text-white" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Live Price Broadcast</div>
                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <motion.div
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-2 w-2 rounded-full bg-emerald-400"
                          />
                          Active
                        </div>
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="h-8 w-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center"
                    >
                      <Wifi className="h-4 w-4 text-gray-600" />
                    </motion.div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      { label: 'Lucky TTP', status: 'Synced', value: '+124 labels' },
                      { label: 'Lucky271', status: 'Syncing', value: '12 updates' },
                      { label: 'Downtown', status: 'Queued', value: '3 promos' },
                    ].map((row, index) => (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{row.label}</div>
                            <div className="text-xs text-gray-500">{row.value}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.div 
                              animate={{ 
                                backgroundColor: row.status === 'Syncing' 
                                  ? ['#3b82f6', '#1d4ed8', '#3b82f6'] 
                                  : row.status === 'Queued'
                                    ? ['#f59e0b', '#d97706', '#f59e0b']
                                    : '#10b981'
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="h-2 w-2 rounded-full"
                            />
                            <span className="text-xs text-gray-500">{row.status}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    variants={pulseAnimation}
                    initial="initial"
                    animate="animate"
                    className="mt-6 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-4"
                  >
                    <div className="flex justify-between items-center text-sm text-gray-200">
                      <span>Next sync window:</span>
                      <motion.span 
                        className="font-mono"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        00:00:12
                      </motion.span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <motion.div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        animate={{ x: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section with wave animation */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden"
        >
          <motion.div
            variants={waveAnimation}
            animate="animate"
            className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: stat.delay,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm"
                >
                  <motion.div 
                    className="text-4xl font-bold mb-2 text-white"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 20, 
                      delay: stat.delay 
                    }}
                    viewport={{ once: true }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="flex items-center justify-center gap-2 text-blue-100">
                    <stat.icon className="h-4 w-4" />
                    <div>{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Features Section with enhanced animations */}
        <section id="features" className="py-20 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.h2 
                variants={typingEffect}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Powerful Features for Modern Retail
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl text-gray-600 max-w-2xl mx-auto"
              >
                Everything you need to manage digital price labels across your entire retail chain
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60, rotateY: 90 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ 
                    delay: feature.delay,
                    duration: 0.8,
                    ease: "backOut"
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -15, 
                    boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
                  }}
                  className="p-8 hover:shadow-2xl transition-all duration-300 rounded-2xl border border-gray-200 bg-white"
                >
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}
                  >
                    <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: feature.delay + 0.2, duration: 0.6 }}
                    className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 mt-4"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works with animated connection lines */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
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
              {/* Animated connection lines */}
              <motion.div 
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                viewport={{ once: true }}
                className="hidden lg:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 60, scale: 0.8 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: item.delay,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className="text-center relative"
                  >
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-2xl font-bold mb-4 mx-auto relative z-10"
                    >
                      <item.icon className="h-8 w-8" />
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

        {/* Use Cases with staggered animations */}
        <section id="usecases" className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: useCase.delay,
                    duration: 0.8,
                    ease: "backOut"
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    x: index % 2 === 0 ? 10 : -10,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
                  }}
                  className="p-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`p-3 rounded-lg ${useCase.bgColor}`}
                    >
                      <useCase.icon className={`h-6 w-6 ${useCase.iconColor}`} />
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
            </div>
          </div>
        </section>

        {/* Pricing with popular badge animation */}
        <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Pricing</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple plans for single stores to large retail chains.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: plan.delay,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -15, scale: 1.02 }}
                  className={[
                    'rounded-3xl border bg-white p-8 shadow-lg transition-all duration-300 relative',
                    plan.highlight ? 'border-blue-600 ring-4 ring-blue-100' : 'border-gray-200',
                  ].join(' ')}
                >
                  {plan.highlight && (
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
                        transition={{ delay: idx * 0.1 + plan.delay }}
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
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          size="lg"
                          className={[
                            'w-full relative overflow-hidden group',
                            plan.highlight 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' 
                              : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                          ].join(' ')}
                        >
                          <span className="relative z-10 text-white">{plan.cta}</span>
                          <motion.span
                            variants={shimmerAnimation}
                            initial="initial"
                            animate="animate"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          />
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

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

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
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
                <div className="mt-8 space-y-4">
                  {[
                    { icon: Phone, text: '+1 (555) 123-4567' },
                    { icon: Mail, text: 'hello@digitallabel.com' },
                    { icon: Headphones, text: '24/7 Support Available' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 text-gray-700"
                    >
                      <item.icon className="h-5 w-5 text-blue-600" />
                      <span>{item.text}</span>
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
                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xl"
              >
                <form className="space-y-6">
                  {[
                    { label: 'Name', placeholder: 'Your name', type: 'text' },
                    { label: 'Email', placeholder: 'you@company.com', type: 'email' },
                    { label: 'Message', placeholder: 'Tell us what you need...', type: 'textarea' }
                  ].map((field, index) => (
                    <motion.div
                      key={field.label}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <label className="text-sm font-medium text-gray-700">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          className="mt-2 min-h-[140px] w-full rounded-xl border border-gray-300 bg-white p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="mt-2 h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder={field.placeholder}
                        />
                      )}
                    </motion.div>
                  ))}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="button" 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    >
                      Send message
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section with enhanced visibility */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 relative overflow-hidden"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -left-40 -bottom-40 h-96 w-96 rounded-full bg-white/10 blur-3xl"
          />
          
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl text-center relative z-10">
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-8"
            >
              Ready to Transform Your Retail Operations?
            </motion.h2>
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto"
            >
              Join hundreds of retail chains already using Digital Label Pro
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-600 hover:bg-gray-100 gap-2 shadow-2xl px-8"
                  >
                    <span className="flex items-center gap-2 text-lg">
                      Start Free Trial
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-white/20 text-white border-white hover:bg-white/30 hover:text-white shadow-2xl px-8 backdrop-blur-sm"
                  >
                    <span className="flex items-center gap-2 text-lg">
                      Schedule Demo
                      <MessageSquare className="h-5 w-5" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Footer with animations */}
        <motion.footer
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gray-900 text-gray-400 py-16"
        >
          <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="md:col-span-2"
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center"
                  >
                    <Store className="h-6 w-6 text-white" />
                  </motion.div>
                  <span className="text-2xl font-bold text-white">
                    Digital Label
                  </span>
                </div>
                <p className="text-sm max-w-md">
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIndex * 0.1 + 0.2 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-white font-semibold mb-6">{column.title}</h3>
                  <ul className="space-y-3">
                    {column.links.map((link, linkIndex) => (
                      <motion.li
                        key={link}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: linkIndex * 0.05 + colIndex * 0.1 + 0.3 }}
                        viewport={{ once: true }}
                        whileHover={{ x: 5 }}
                      >
                        <a 
                          href={link === 'Demo' ? '/login' : `#${link.toLowerCase().replace(' ', '')}`} 
                          className="text-sm hover:text-white transition-colors duration-300"
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
              className="border-t border-gray-800 mt-12 pt-8 text-center text-sm"
            >
              <p>© 2026 Digital Label. All rights reserved to Kimmy and Her Bf.</p>
            </motion.div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}