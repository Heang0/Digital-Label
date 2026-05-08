'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slideInFromLeft, scaleIn } from './animations';

export const Contact = () => {
  return (
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
  );
};
