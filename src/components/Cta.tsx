import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Cta = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const ctaRef = useScrollAnimation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section id="cta" className="px-3 sm:px-4 md:px-8 py-10 md:py-14 relative overflow-hidden scroll-mt-20">
      {/* Background elements */}
      <div className="absolute -top-48 -right-48 w-[400px] h-[400px] rounded-full bg-budgify-500/10 blur-[100px] -z-10"></div>
      <div className="absolute -bottom-24 -left-24 w-[240px] h-[240px] rounded-full bg-emerald-600/10 blur-[80px] -z-10"></div>
      
      <div ref={ctaRef} className="max-w-5xl mx-auto">
        <div className="glass-card p-4 sm:p-6 md:p-10 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-budgify-400 to-budgify-600"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-budgify-500/10 blur-[60px] -z-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Ready to transform your 
                <span className="relative inline-block ml-1.5">
                  <span className="absolute -inset-0.5 rounded-lg bg-budgify-500/20 blur-sm -z-10"></span>
                  <span className="text-budgify-500 relative">financial future?</span>
                </span>
              </h2>
              
              <p className="text-sm sm:text-base text-white/80 mb-4 md:mb-5">
                Join thousands of users who are taking control of their finances, saving more, and achieving their financial goals with Axent.
              </p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3">
                <button 
                  onClick={handleGetStarted}
                  className="btn-glow bg-budgify-600 text-white font-medium rounded-full px-5 sm:px-6 py-2.5 hover:bg-budgify-500 transition-colors w-full sm:w-auto text-center text-sm"
                >
                  Get started for free
                </button>
                <Link to="/learn-more" className="flex items-center justify-center gap-1.5 glass rounded-full px-5 sm:px-6 py-2.5 hover:bg-white/10 transition-colors group w-full sm:w-auto text-sm">
                  Learn more
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            
            <div className="relative mt-5 md:mt-0">
              <div className="glass rounded-lg overflow-hidden aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-budgify-500/20 to-emerald-600/20 opacity-50"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 sm:p-4 md:p-6">
                  <h3 className="text-base sm:text-lg font-bold mb-1.5">Start your 14-day free trial</h3>
                  <p className="text-xs sm:text-sm text-white/80 mb-3 sm:mb-4">No credit card required</p>
                  <ul className="text-left space-y-1.5 mb-3 sm:mb-4 text-xs sm:text-sm">
                    <li className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-budgify-500/20 mr-2 flex items-center justify-center">
                        <span className="text-budgify-500 text-[10px]">✓</span>
                      </div>
                      Full access to all features
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-budgify-500/20 mr-2 flex items-center justify-center">
                        <span className="text-budgify-500 text-[10px]">✓</span>
                      </div>
                      Personalized financial insights
                    </li>
                    <li className="flex items-center">
                      <div className="w-4 h-4 rounded-full bg-budgify-500/20 mr-2 flex items-center justify-center">
                        <span className="text-budgify-500 text-[10px]">✓</span>
                      </div>
                      Cancel anytime
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
