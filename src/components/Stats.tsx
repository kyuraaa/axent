import React from 'react';
import { Users, Clock, Target, Award } from 'lucide-react';
import { useStaggerAnimation } from '@/hooks/useScrollAnimation';

const Stats = () => {
  const containerRef = useStaggerAnimation('.stat-card');

  const stats = [
    {
      value: '7k+',
      description: 'Trusted, satisfied users.',
      icon: Users,
      borderColor: 'border-green-500/30',
      glowColor: 'shadow-green-500/20',
      color: 'from-green-400/20 to-emerald-500/20'
    },
    {
      value: '8+',
      description: 'Years of expertise in financial management.',
      icon: Award,
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/20',
      color: 'from-emerald-400/20 to-green-500/20'
    },
    {
      value: '24/7',
      description: 'AI-powered financial support.',
      icon: Clock,
      borderColor: 'border-green-500/30',
      glowColor: 'shadow-green-500/20',
      color: 'from-green-400/20 to-emerald-500/20'
    },
    {
      value: '50+',
      description: 'Successful financial goals achieved.',
      icon: Target,
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/20',
      color: 'from-emerald-400/20 to-green-500/20'
    }
  ];
  
  return (
    <section id="stats" className="px-3 sm:px-4 md:px-8 pt-10 md:pt-14 pb-10 md:pb-14 relative scroll-mt-20">
      {/* Background elements */}
      <div className="absolute left-0 top-16 w-48 h-48 rounded-full bg-budgify-500/5 blur-[60px] -z-10"></div>
      <div className="absolute right-8 bottom-8 w-36 h-36 rounded-full bg-emerald-600/5 blur-[50px] -z-10"></div>
      
      <div ref={containerRef} className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`
                stat-card
                relative p-3 sm:p-4 overflow-hidden text-center sm:text-left
                bg-card/40 backdrop-blur-lg rounded-xl
                border ${stat.borderColor} hover:border-opacity-60
                shadow-md ${stat.glowColor} hover:shadow-lg
                transition-shadow duration-300
              `}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 rounded-xl`}></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-budgify-500/20 flex items-center justify-center mb-2 sm:mb-3 mx-auto sm:mx-0">
                  <stat.icon size={16} className="text-budgify-400 sm:w-[18px] sm:h-[18px]" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-budgify-400 mb-1.5">
                  {stat.value}
                </h3>
                
                <p className="text-xs sm:text-sm text-white/70">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;