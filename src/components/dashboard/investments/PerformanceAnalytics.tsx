import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const PerformanceAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [monthlyReturn, setMonthlyReturn] = useState(0);
  const [yearlyReturn, setYearlyReturn] = useState(0);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [investmentsRes, cryptoRes, exchangeRes] = await Promise.all([
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
        supabase.functions.invoke('exchange-rate')
      ]);

      const rate = exchangeRes.data?.rate || 15700;
      const investments = investmentsRes.data || [];
      const cryptoHoldings = cryptoRes.data || [];

      // Calculate portfolio value
      let stockValue = investments
        .filter(i => i.type === 'stock')
        .reduce((sum, i) => sum + i.current_value, 0);

      let cryptoValue = cryptoHoldings.reduce((sum, c) => 
        sum + (c.amount * c.purchase_price * rate), 0);

      // Simulated gain based on random performance
      const totalValue = stockValue + cryptoValue;
      const simulatedGain = totalValue * 0.12; // 12% gain simulation

      setPortfolioValue(totalValue);
      setTotalGain(simulatedGain);
      setMonthlyReturn(2.5);
      setYearlyReturn(12.3);
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast({ title: 'Error', description: 'Gagal memuat data performa', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Simulated performance data
  const performanceData = useMemo(() => {
    const data = [];
    const now = new Date();
    let value = portfolioValue * 0.85;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      value = value * (1 + (Math.random() * 0.06 - 0.02));
      data.push({
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        value: Math.round(value),
        benchmark: Math.round(value * (0.9 + Math.random() * 0.15)),
      });
    }
    return data;
  }, [portfolioValue]);

  const monthlyReturns = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('id-ID', { month: 'short' }),
      return: (Math.random() * 10 - 3).toFixed(1),
    }));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Performance</h1>
        <p className="text-muted-foreground mt-1">Analisis performa portfolio investasi Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Target className="text-primary mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-xl font-bold">{formatCurrency(portfolioValue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`bg-card/50 backdrop-blur-sm ${totalGain >= 0 ? 'border-green-500/30' : 'border-white/10'}`}>
            <CardContent className="pt-6">
              {totalGain >= 0 ? <TrendingUp className="text-green-500 mb-2" size={24} /> : <TrendingDown className="text-white/70 mb-2" size={24} />}
              <p className="text-sm text-muted-foreground">Total Gain</p>
              <p className={`text-xl font-bold ${totalGain >= 0 ? 'text-green-500' : 'text-white/70'}`}>
                {totalGain >= 0 ? '+' : ''}{formatCurrency(totalGain)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Calendar className="text-emerald-500 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Return Bulanan</p>
              <p className={`text-xl font-bold ${monthlyReturn >= 0 ? 'text-green-500' : 'text-white/70'}`}>
                {monthlyReturn >= 0 ? '+' : ''}{monthlyReturn}%
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <TrendingUp className="text-green-400 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Return Tahunan</p>
              <p className={`text-xl font-bold ${yearlyReturn >= 0 ? 'text-green-500' : 'text-white/70'}`}>
                {yearlyReturn >= 0 ? '+' : ''}{yearlyReturn}%
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performance Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Portfolio vs Benchmark</CardTitle>
            <CardDescription>Perbandingan performa 12 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#portfolioGradient)" 
                    strokeWidth={2}
                    name="Portfolio"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={false}
                    name="Benchmark"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Portfolio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-sm text-muted-foreground">Benchmark (IHSG)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Returns */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Return Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {monthlyReturns.map((item, index) => {
                const returnValue = parseFloat(item.return);
                const isPositive = returnValue >= 0;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border text-center ${isPositive ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 bg-white/5'}`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">{item.month}</p>
                    <p className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-white/70'}`}>
                      {isPositive ? '+' : ''}{item.return}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default PerformanceAnalytics;