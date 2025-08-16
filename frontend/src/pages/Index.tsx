
import React from 'react';
import HeroSection from '@/components/HeroSection';
import Features from '@/components/Features';
import Models from '@/components/Models';
import Testimonials from '@/components/Testimonials';
import Pricing from '@/components/Pricing';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main>
        <HeroSection />
        <Features />
        <Models />
        <Testimonials />
        <Pricing />
      </main>
    </div>
  );
};

export default Index;
