'use client';

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { fadeInUp, staggerContainer } from './animations';

export const UseCases = () => {
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
              className="p-8 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white transition-all duration-300"
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
  );
};
