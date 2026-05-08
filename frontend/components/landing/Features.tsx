'use client';

import { motion } from 'framer-motion';
import { Building2, Smartphone, Users, BarChart3, Shield, Clock } from 'lucide-react';
import { fadeInUp, staggerContainer } from './animations';

export const Features = () => {
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

  return (
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
              className="p-8 hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100 bg-white"
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
  );
};
