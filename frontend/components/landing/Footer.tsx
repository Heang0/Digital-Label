'use client';

import { motion } from 'framer-motion';
import { Store } from 'lucide-react';

export const Footer = () => {
  const columns = [
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
  ];

  return (
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

          {columns.map((column, colIndex) => (
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
  );
};
