import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScoreBreakdown {
  label: string;
  value: number;
  max: number;
}

interface FinancialHealthScoreProps {
  score: number;
  breakdown: ScoreBreakdown[];
}

const FinancialHealthScore = ({ score, breakdown }: FinancialHealthScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-green-400';
    if (score >= 40) return 'text-white/70';
    return 'text-white/50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    if (score >= 40) return 'Cukup';
    return 'Perlu Perbaikan';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-green-500 to-emerald-600';
    if (score >= 40) return 'from-green-600 to-emerald-700';
    return 'from-white/40 to-white/60';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-white/10 backdrop-blur-xl bg-white/5">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
            {/* Score Circle */}
            <div className="flex flex-col items-center justify-center lg:px-8">
              <h3 className="text-lg font-semibold mb-6 text-center">Skor Kesehatan Keuangan</h3>
              <div className="relative w-32 h-32 mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/10"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - score / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={score >= 60 ? "#10b981" : "#ffffff"} stopOpacity={score >= 60 ? 1 : 0.5} />
                      <stop offset="100%" stopColor={score >= 60 ? "#22c55e" : "#ffffff"} stopOpacity={score >= 60 ? 1 : 0.7} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    className={cn("text-3xl font-bold tabular-nums", getScoreColor(score))}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {score}
                  </motion.span>
                  <span className="text-sm font-medium text-muted-foreground">dari 100</span>
                </div>
              </div>
              <motion.div 
                className={cn("mt-3 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm", 
                  `bg-gradient-to-r ${getScoreGradient(score)} bg-opacity-30 border border-white/20`
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-white drop-shadow-lg">{getScoreLabel(score)}</span>
              </motion.div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-3">
              <h4 className="text-sm font-medium text-white/60 mb-4">Rincian Skor</h4>
              {breakdown.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-white/70">{item.label}</span>
                    <span className="text-white/90 tabular-nums">{Math.round(item.value)}/{item.max}</span>
                  </div>
                  <Progress 
                    value={(item.value / item.max) * 100} 
                    className="h-2 bg-white/10"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default FinancialHealthScore;