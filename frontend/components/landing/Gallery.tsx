'use client';

import { motion } from 'framer-motion';
import { slideInFromLeft, staggerContainer, scaleIn } from './animations';

export const Gallery = () => {
  const images = [
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
  ];

  const tags = ["Crisp shelf display", "Real-time adjustments", "Multi-store rollout", "Mobile-friendly ops"];

  return (
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
              {tags.map((tag, index) => (
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
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {images.map((img) => (
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
  );
};
