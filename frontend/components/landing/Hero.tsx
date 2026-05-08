'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fadeInUp, staggerContainer, floatAnimation, slideInFromRight, pulseAnimation } from './animations';

export const Hero = () => {
  return (
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
  );
};
