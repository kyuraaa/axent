import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import Faq from '@/components/Faq';
import Cta from '@/components/Cta';
import Footer from '@/components/Footer';
import { NeuralNetworkShaderBackground } from '@/components/ui/neural-network-hero';
import { BackgroundGradientGlow } from '@/components/ui/background-gradient-glow';
import { useLenis } from '@/hooks/use-lenis';
import AxentAILanding from '@/components/landing/AxentAILanding';

const Index = () => {
  useLenis();

  return (
    <div className="min-h-screen relative bg-background">
      {/* Hero Section with Neural Network Shader */}
      <section className="relative h-[100vh] lg:h-[105vh] overflow-hidden">
        <div className="absolute inset-0">
          <NeuralNetworkShaderBackground />
        </div>
        <div className="relative z-20">
          <Navbar />
          <Hero />
        </div>
        {/* Gradient fade at bottom of hero for seamless transition */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent z-10" />
      </section>
      
      {/* AI Command Section - Main Feature */}
      <AxentAILanding />
      
      {/* Rest of the page with gradient glow background */}
      <div className="relative">
        <BackgroundGradientGlow />
        <Stats />
        <Features />
        <Testimonials />
        <Faq />
        <Cta />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
