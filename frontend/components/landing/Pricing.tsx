'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scaleIn, staggerContainer } from './animations';

export const Pricing = () => {
  const plans = [
    {
      name: 'Basic',
      price: '$2',
      note: 'For small chains',
      items: ['Up to 5 branches', '1000 labels', 'Basic support'],
      cta: 'Get Started',
      href: '/register',
      highlight: false,
    },
    {
      name: 'Professional',
      price: '$10',
      note: 'For growing retail chains',
      items: ['Up to 20 branches', '5000 labels', 'Priority support', 'Advanced analytics'],
      cta: 'Start Free Trial',
      href: '/register',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'For large retail groups',
      items: ['Unlimited branches', 'Unlimited labels', '24/7 VIP support', 'Custom integrations'],
      cta: 'Contact Sales',
      href: '#contact',
      highlight: false,
    },
  ];

  return (
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
            Scale your retail business with our enterprise-grade solutions.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {plans.map((plan, index) => (
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
  );
};
