import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  PieChart as PieChartIcon, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Bitcoin,
  Wallet,
  Building2
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(45, 93%, 47%)', 'hsl(262, 83%, 58%)', 'hsl(200, 98%, 39%)'];

const AllocationManager = () => {
  const [loading, setLoading] = useState(true);
  const [allocation, setAllocation] = useState({
    stocks: 0,
    crypto: 0,
    cash: 0,
    bonds: 0,
    realEstate: 0,
  });

  const [targetAllocation, setTargetAllocation] = useState({
    stocks: 40,
    crypto: 20,
    cash: 20,
    bonds: 15,
    realEstate: 5,
  });

  useEffect(() => {
    fetchAllocationData();
  }, []);

  const fetchAllocationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [transactionsRes, investmentsRes, cryptoRes, exchangeRes] = await Promise.all([
        supabase.from('budget_transactions').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
        supabase.functions.invoke('exchange-rate')
      ]);

      const rate = exchangeRes.data?.rate || 15700;

      // Calculate cash
      const transactions = transactionsRes.data || [];
      const cash = transactions.reduce((sum, t) => 
        t.transaction_type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount), 0);

      // Calculate stocks
      const investments = investmentsRes.data || [];
      const stocks = investments
        .filter(i => i.type === 'stock')
        .reduce((sum, i) => sum + i.current_value, 0);

      // Calculate crypto
      const cryptoHoldings = cryptoRes.data || [];
      const crypto = cryptoHoldings.reduce((sum, c) => 
        sum + (c.amount * c.purchase_price * rate), 0);

      const total = Math.max(1, Math.max(0, cash) + stocks + crypto);

      setAllocation({
        stocks: (stocks / total) * 100,
        crypto: (crypto / total) * 100,
        cash: (Math.max(0, cash) / total) * 100,
        bonds: 0,
        realEstate: 0,
      });
    } catch (error) {
      console.error('Error fetching allocation:', error);
      toast({ title: 'Error', description: 'Gagal memuat data alokasi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const pieData = useMemo(() => [
    { name: 'Stocks', value: allocation.stocks, target: targetAllocation.stocks, icon: Building2 },
    { name: 'Crypto', value: allocation.crypto, target: targetAllocation.crypto, icon: Bitcoin },
    { name: 'Cash', value: allocation.cash, target: targetAllocation.cash, icon: Wallet },
    { name: 'Bonds', value: allocation.bonds, target: targetAllocation.bonds, icon: Briefcase },
    { name: 'Real Estate', value: allocation.realEstate, target: targetAllocation.realEstate, icon: Building2 },
  ].filter(d => d.value > 0 || d.target > 0), [allocation, targetAllocation]);

  const isBalanced = useMemo(() => {
    return pieData.every(d => Math.abs(d.value - d.target) <= 10);
  }, [pieData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
        <h1 className="text-2xl sm:text-3xl font-bold">Allocation</h1>
        <p className="text-muted-foreground mt-1">Visualisasi dan target alokasi aset</p>
      </div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className={`bg-card/50 backdrop-blur-sm ${isBalanced ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {isBalanced ? (
                <>
                  <CheckCircle2 className="text-green-500" size={32} />
                  <div>
                    <h3 className="font-semibold text-green-500">Portfolio Seimbang</h3>
                    <p className="text-sm text-muted-foreground">Alokasi aset Anda sesuai dengan target</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="text-yellow-500" size={32} />
                  <div>
                    <h3 className="font-semibold text-yellow-500">Perlu Rebalancing</h3>
                    <p className="text-sm text-muted-foreground">Beberapa alokasi berbeda dari target</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Allocation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Alokasi Saat Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.filter(d => d.value > 0).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{item.name}: {item.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Target Allocation */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Target Alokasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.filter(d => d.target > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="target"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.filter(d => d.target > 0).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{item.name}: {item.target}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Perbandingan Alokasi</CardTitle>
            <CardDescription>Aktual vs Target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {pieData.map((item, index) => {
                const diff = item.value - item.target;
                const Icon = item.icon;
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: COLORS[index % COLORS.length] + '30' }}>
                          <Icon size={16} style={{ color: COLORS[index % COLORS.length] }} />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{item.value.toFixed(1)}%</span>
                        <span className="text-muted-foreground"> / {item.target}%</span>
                        <span className={`ml-2 text-sm ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(100, item.value)}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }} 
                      />
                      <div 
                        className="absolute h-full w-0.5 bg-foreground"
                        style={{ left: `${item.target}%` }}
                      />
                    </div>
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

export default AllocationManager;
