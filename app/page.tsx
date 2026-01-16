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
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
                <span className="text-xl font-bold text-gray-900">
                  Digital Label
                </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#usecases" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Use Cases
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                Contact
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Get Started Free
                </Button>
              </Link>
            </div>
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 lg:px-10 max-w-6xl py-4 space-y-3">
              <a href="#features" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700">
                Features
              </a>
              <a href="#usecases" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700">
                Use Cases
              </a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700">
                Pricing
              </a>
              <a href="#contact" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-700">
                Contact
              </a>
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
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="absolute inset-0">
          <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-slate-100 blur-2xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_45%)]" />
        </div>
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl py-16 md:py-28 relative">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-xs font-semibold tracking-wide">
                <Zap className="h-4 w-4 text-blue-300" />
                Retail pricing, unified in seconds
              </div>

              <h1 className="mt-6 text-4xl md:text-6xl font-semibold text-slate-900 leading-tight">
                A modern command center for digital shelf labels.
              </h1>

              <p className="mt-5 text-lg text-slate-600 max-w-xl">
                Push price updates, promos, and stock alerts to every aisle instantly. Keep teams aligned with
                real-time visibility across all stores.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="border-slate-300 text-slate-900 hover:bg-slate-100">
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 px-3 py-1">Instant price sync</span>
                <span className="rounded-full border border-slate-200 px-3 py-1">Branch-level control</span>
                <span className="rounded-full border border-slate-200 px-3 py-1">Offline-safe labels</span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Live Price Broadcast</div>
                  <span className="text-xs text-emerald-600 font-medium">Active</span>
                </div>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Lucky TTP', status: 'Synced', value: '+124 labels' },
                    { label: 'Lucky271', status: 'Syncing', value: '12 updates' },
                    { label: 'Downtown', status: 'Queued', value: '3 promos' },
                  ].map((row) => (
                    <div key={row.label} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-900">{row.label}</span>
                        <span className="text-xs text-slate-500">{row.value}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {row.status}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl bg-slate-900 px-4 py-3 text-xs text-slate-200">
                  Next sync window: 00:00:12
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-gray-400">Retail Chains</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-gray-400">Store Branches</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">2M+</div>
              <div className="text-gray-400">Labels Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Retail
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage digital price labels across your entire retail chain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600 mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple 4-step process to transform your price management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Register Your Chain
              </h3>
              <p className="text-gray-600">
                Sign up and create your retail chain profile
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Add Your Stores
              </h3>
              <p className="text-gray-600">
                Create branches and import your products
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect Labels
              </h3>
              <p className="text-gray-600">
                Register digital labels to each product
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Update Prices Instantly
              </h3>
              <p className="text-gray-600">
                Change prices from dashboard, labels update in seconds
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="usecases" className="py-20 bg-white">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industry Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Perfect solution for various retail businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="card p-8">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {useCase.industry}
                    </h3>
                    <p className="text-gray-600">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Retail Operations?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of retail chains already using Digital Label Pro
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-white border-white bg-white/10 hover:bg-white/20">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 lg:px-10 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
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
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#usecases" className="hover:text-white transition-colors">Use Cases</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 Digital Label. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}





