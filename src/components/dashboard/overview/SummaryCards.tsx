import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, LineChart, Briefcase } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';

interface Metrics {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  investmentValue: number;
  businessProfit: number;
}

interface SummaryCardsProps {
  metrics: Metrics;
}

const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  if (suffix === '%') {
    return <span className="tabular-nums">{prefix}{displayValue.toFixed(1)}{suffix}</span>;
  }
  return <span className="tabular-nums">{prefix}{formatRupiah(displayValue)}{suffix}</span>;
};

const SummaryCards = ({ metrics }: SummaryCardsProps) => {
  const cards = [
    {
      title: 'Total Kekayaan',
      value: metrics.netWorth,
      icon: Wallet,
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500/20',
      trend: metrics.netWorth > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Pemasukan Bulan Ini',
      value: metrics.monthlyIncome,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      iconBg: 'bg-emerald-500/20',
      trend: 'up'
    },
    {
      title: 'Pengeluaran Bulan Ini',
      value: metrics.monthlyExpenses,
      icon: TrendingDown,
      gradient: 'from-green-600 to-emerald-700',
      iconBg: 'bg-green-500/20',
      trend: 'down'
    },
    {
      title: 'Tingkat Tabungan',
      value: metrics.savingsRate,
      icon: PiggyBank,
      gradient: 'from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-500/20',
      isPercentage: true,
      trend: metrics.savingsRate > 0 ? 'up' : 'down'
    },
    {
      title: 'Nilai Investasi',
      value: metrics.investmentValue,
      icon: LineChart,
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-500/20',
      trend: 'up'
    },
    {
      title: 'Profit Bisnis',
      value: metrics.businessProfit,
      icon: Briefcase,
      gradient: 'from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-500/20',
      trend: metrics.businessProfit >= 0 ? 'up' : 'down'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
        >
          <Card className={cn(
            "relative overflow-hidden border-white/10 backdrop-blur-xl",
            "bg-gradient-to-br bg-white/5 hover:bg-white/10 transition-all duration-300"
          )}>
            <div className={cn(
              "absolute inset-0 opacity-20 bg-gradient-to-br",
              card.gradient
            )} />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">{card.title}</span>
                <div className={cn("p-2 rounded-lg", card.iconBg)}>
                  <card.icon size={18} className="text-white" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold">
                {card.isPercentage ? (
                  <AnimatedNumber value={card.value} suffix="%" />
                ) : (
                  <AnimatedNumber value={card.value} />
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {card.trend === 'up' && (
                  <TrendingUp size={14} className="text-emerald-400" />
                )}
                {card.trend === 'down' && card.title !== 'Pengeluaran Bulan Ini' && (
                  <TrendingDown size={14} className="text-white/50" />
                )}
                <span className="text-xs text-white/50">
                  {card.title === 'Pengeluaran Bulan Ini' ? 'Bulan ini' : 
                   card.isPercentage ? 'dari pemasukan' : 'Total saat ini'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default SummaryCards;