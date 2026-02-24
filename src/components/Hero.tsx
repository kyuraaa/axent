import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { supabase } from '@/integrations/supabase/client';
import { SyntheticHeroBackground } from './ui/synthetic-hero';
const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // GSAP entrance animation
    const tl = gsap.timeline({
      delay: 0.3
    });
    tl.fromTo(titleRef.current, {
      opacity: 0,
      y: 60
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    }).fromTo(subtitleRef.current, {
      opacity: 0,
      y: 40
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.5').fromTo(buttonsRef.current, {
      opacity: 0,
      y: 30
    }, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.4');
  }, []);
  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  return <section id="hero" className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-3 sm:px-4 md:px-8 lg:px-12 scroll-mt-20">

    {/* Synthetic Hero Shader Background */}
    <div className="absolute inset-0 -z-10">
      <SyntheticHeroBackground />
    </div>

    <div className="absolute inset-0 -z-10 pointer-events-none">
      <div className="absolute top-16 right-0 w-2/3 h-2/3 rounded-full bg-white/5 blur-[60px]"></div>
      <div className="absolute bottom-8 left-8 w-1/3 h-1/3 rounded-full bg-budgify-500/3 blur-[50px]"></div>
      <div className="absolute top-1/4 right-1/3 w-24 sm:w-36 h-24 sm:h-36 rounded-full bg-white/3 blur-[40px]"></div>
      <div className="absolute bottom-1/3 left-1/4 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-cyan-400/2 blur-[50px]"></div>
    </div>

    <div ref={heroRef} className="flex flex-col items-center justify-center min-h-[50vh] sm:h-[55vh] lg:min-h-[60vh] w-full max-w-5xl lg:max-w-6xl mx-auto text-center relative z-10 px-0">
      {/* Badge */}
      <div className="mb-3 sm:mb-4">
        <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 backdrop-blur-md bg-white/5">
          <span className="text-[8px] sm:text-[10px] font-medium text-emerald-400 uppercase tracking-wide whitespace-nowrap">
            AI-Powered
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-white/30 flex-shrink-0" />
          <span className="text-[8px] sm:text-[10px] text-white/70 whitespace-nowrap">
            Financial Technology
          </span>
        </div>
      </div>

      <div className="mb-3 sm:mb-4 lg:mb-6 text-center w-full px-3 sm:px-4">
        <h1 ref={titleRef} className="text-[1.25rem] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-5 lg:mb-6 text-center mx-auto leading-[1.2] opacity-0 text-white">
          Unlocking the potential{' '}
          <br className="hidden sm:block" />
          of financial technology
        </h1>
      </div>

      <div className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto mb-4 sm:mb-5 md:mb-8 lg:mb-10 text-center px-3 sm:px-4">
        <p ref={subtitleRef} className="text-[10px] sm:text-sm md:text-base lg:text-lg text-white/80 opacity-0 leading-relaxed">
          We empower individuals to take control of their finances with AI-driven insights, smart budgeting, and financial growth strategies.
        </p>
      </div>

      <div ref={buttonsRef} className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 px-3 w-full max-w-sm lg:max-w-md mx-auto opacity-0">
        <button onClick={handleGetStarted} className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white font-medium rounded-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 hover:from-emerald-600 hover:to-teal-500 transition-all duration-300 w-full sm:w-auto text-center text-xs sm:text-sm lg:text-base">
          Let's start
        </button>
        <Link to="/learn-more" className="flex items-center justify-center gap-1.5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 lg:py-3 hover:bg-white/10 transition-colors group relative overflow-hidden w-full sm:w-auto text-xs sm:text-sm lg:text-base">
          <span className="relative z-10 flex items-center gap-1.5">
            Learn more
            <ArrowRight size={10} className="text-budgify-400 group-hover:text-cyan-400 transition-colors" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
        </Link>
      </div>

      {/* Micro Details */}
      <ul className="mt-4 sm:mt-6 lg:mt-8 flex flex-wrap justify-center gap-x-3 sm:gap-x-4 lg:gap-x-6 gap-y-1.5 text-[10px] sm:text-xs lg:text-sm text-white/50 px-3">
        <li className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
          AI-driven insights
        </li>
        <li className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
          Smart budgeting tools
        </li>
        <li className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
          Real-time analytics
        </li>
      </ul>
    </div>
  </section>;
};
export default Hero;