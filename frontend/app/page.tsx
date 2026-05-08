'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { Gallery } from '@/components/landing/Gallery';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { UseCases } from '@/components/landing/UseCases';
import { Pricing } from '@/components/landing/Pricing';
import { Contact } from '@/components/landing/Contact';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
      <Navbar />
      <Hero />
      <Stats />
      <Gallery />
      <Features />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Contact />
      <CTA />
      <Footer />
    </div>
  );
}