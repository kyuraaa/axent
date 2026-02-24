import React from 'react';
import { ArrowRight, PieChart, TrendingUp, BrainCircuit, LineChart, CreditCard, Lock, Gift, Wallet, BarChart4, ArrowUpRight, Briefcase } from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const Features = () => {
  const headingRef = useScrollAnimation();
  const mainFeaturesRef = useStaggerAnimation('.main-feature');
  const additionalFeaturesRef = useStaggerAnimation('.additional-feature');
  const ctaRef = useScrollAnimation();

  const mainFeatures = [
    {
      title: 'Smart Budgeting',
      description: 'Create personalized budgets based on your spending habits and financial goals with AI assistance.',
      icon: PieChart,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-budgify-400'
    },
    {
      title: 'Investment Tracking',
      description: 'Monitor your investments in real-time with advanced analytics and AI-powered recommendations.',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'AI Financial Advisor',
      description: 'Get real-time financial advice based on market trends, personalized goals, and risk tolerance with our API-powered insights.',
      icon: BrainCircuit,
      color: 'bg-gradient-to-br from-emerald-400/20 to-green-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Expense Analytics',
      description: 'Visualize your spending patterns with detailed analytics and gain insights to optimize your finances.',
      icon: LineChart,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    }
  ];

  const additionalFeatures = [
    {
      title: 'Secure Transactions',
      description: 'Bank-level encryption for all your financial data and transactions.',
      icon: Lock,
      color: 'bg-gradient-to-br from-emerald-400/20 to-green-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Bill Management',
      description: 'Track, manage and pay your bills on time with automated reminders.',
      icon: CreditCard,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Business Finance Tools',
      description: 'Comprehensive tools for business expense tracking, profit analysis, and business budgeting.',
      icon: Briefcase,
      color: 'bg-gradient-to-br from-emerald-400/20 to-green-500/20',
      iconColor: 'text-emerald-500'
    },
    {
      title: 'Rewards Program',
      description: 'Earn points and rewards for smart financial decisions and consistent savings.',
      icon: Gift,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Crypto Tracking',
      description: 'Monitor and manage your cryptocurrency investments alongside traditional assets.',
      icon: Wallet,
      color: 'bg-gradient-to-br from-emerald-400/20 to-green-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      title: 'Tax Planning',
      description: 'Optimize your tax strategy with AI-powered recommendations and forecasting.',
      icon: BarChart4,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    },
    {
      title: 'Financial Goals',
      description: 'Set, track, and achieve your financial goals with personalized roadmaps.',
      icon: ArrowUpRight,
      color: 'bg-gradient-to-br from-green-400/20 to-emerald-500/20',
      iconColor: 'text-green-400'
    }
  ];

  return (
    <section id="features" className="px-3 sm:px-4 md:px-8 py-10 md:py-14 relative overflow-hidden scroll-mt-20">
      <div className="absolute top-1/4 right-0 w-1/2 h-1/2 rounded-full bg-budgify-500/5 blur-[120px] -z-10"></div>
      <div className="absolute bottom-1/4 left-0 w-1/3 h-1/3 rounded-full bg-emerald-600/5 blur-[100px] -z-10"></div>
      
      <div className="max-w-6xl mx-auto">
        <div ref={headingRef} className="text-center mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent px-3">
            Powerful Financial Tools
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto px-3">
            Our comprehensive suite of features is designed to make financial management 
            simple, intuitive, and effective for everyone at every stage of their financial journey.
          </p>
        </div>
        
        <div ref={mainFeaturesRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8 md:mb-10">
          {mainFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="main-feature glass-card p-4 md:p-5 relative group overflow-hidden"
            >
              <div className={`absolute inset-0 ${feature.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              
              <div className="relative z-10">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-3 md:mb-4 bg-white/5 backdrop-blur-xl border border-white/10">
                  <feature.icon size={18} className={`${feature.iconColor} md:w-5 md:h-5`} />
                </div>
                
                <h3 className="text-base md:text-lg font-bold mb-1.5 md:mb-2">{feature.title}</h3>
                <p className="text-xs md:text-sm text-white/70 mb-3 md:mb-4">{feature.description}</p>
                
                <button className="flex items-center text-xs md:text-sm text-budgify-400 font-medium group-hover:text-budgify-300 transition-colors">
                  Learn more
                  <ArrowRight size={12} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="relative flex items-center my-8 md:my-10">
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-budgify-500/30 to-transparent"></div>
          <div className="mx-2 sm:mx-3 px-2.5 sm:px-3 py-1.5 rounded-full bg-budgify-900/50 border border-budgify-500/20 text-budgify-400 font-medium text-[10px] sm:text-xs animate-pulse whitespace-nowrap">
            Additional Features
          </div>
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-budgify-500/30 to-transparent"></div>
        </div>
        
        <div ref={additionalFeaturesRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {additionalFeatures.map((feature, index) => (
            <div 
              key={index} 
              className="additional-feature glass-card p-3 sm:p-4 relative group overflow-hidden"
            >
              <div className={`absolute inset-0 ${feature.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
              
              <div className="relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2 sm:mb-3 bg-white/5 backdrop-blur-xl border border-white/10">
                  <feature.icon size={16} className={`${feature.iconColor} sm:w-[18px] sm:h-[18px]`} />
                </div>
                
                <h3 className="text-sm sm:text-base font-bold mb-1.5">{feature.title}</h3>
                <p className="text-white/70 text-[10px] sm:text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div ref={ctaRef} className="mt-8 md:mt-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-budgify-500/10 via-transparent to-budgify-500/10 rounded-xl blur-xl -z-10"></div>
          <div className="glass-card p-4 sm:p-6 md:p-8 border border-budgify-500/20 group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-center">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 md:mb-3 bg-gradient-to-r from-budgify-400 to-emerald-400 bg-clip-text text-transparent">
                  Unlock Your Financial Potential
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mb-3 md:mb-4">
                  With over 12+ powerful features, Axent gives you everything you need to take
                  control of your finances, make informed decisions, and achieve your financial goals.
                </p>
                <button className="btn-glow bg-budgify-600 text-white font-medium rounded-full px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-budgify-500 transition-colors flex items-center gap-1.5 text-xs sm:text-sm w-full sm:w-auto justify-center">
                  Explore all features
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="relative mt-4 md:mt-0">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-budgify-500/20 to-emerald-600/10 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-3/4 h-3/4">
                      <div className="absolute top-0 left-0 w-1/2 h-1/2 rounded-full bg-budgify-500/30 filter blur-xl animate-pulse"></div>
                      <div className="absolute bottom-0 right-0 w-2/3 h-1/2 rounded-full bg-emerald-500/20 filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-3xl sm:text-4xl font-bold text-white">12+</span>
                          <p className="text-xs sm:text-sm text-budgify-400 font-medium mt-1.5">Advanced Features</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;