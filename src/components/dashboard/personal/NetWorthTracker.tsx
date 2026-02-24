import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  Bitcoin, 
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AssetData {
  cash: number;
  stocks: number;
  crypto: number;
  business: number;
}

interface NetWorthHistory {
  date: string;
  value: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(142, 70%, 45%)', 'hsl(142, 60%, 55%)'];

const NetWorthTracker = () => {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetData>({ cash: 0, stocks: 0, crypto: 0, business: 0 });
  const [liabilities, setLiabilities] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(15700);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchNetWorthData();
  }, []);

  const fetchNetWorthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all data in parallel
      const [transactionsRes, investmentsRes, cryptoRes, businessRes, exchangeRes] = await Promise.all([
        supabase.from('budget_transactions').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
        supabase.from('business_finances').select('*').eq('user_id', user.id),
        supabase.functions.invoke('exchange-rate')
      ]);

      const rate = exchangeRes.data?.rate || 15700;
      setExchangeRate(rate);

      // Calculate cash from transactions
      const transactions = transactionsRes.data || [];
      const cash = transactions.reduce((sum, t) => {
        return t.transaction_type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);

      // Calculate stock value
      const investments = investmentsRes.data || [];
      const stockSymbols = investments.filter(i => i.type === 'stock').map(i => i.name);
      
      let stocks = 0;
      if (stockSymbols.length > 0) {
        try {
          const { data: priceData } = await supabase.functions.invoke('stock-prices', {
            body: { symbols: stockSymbols }
          });
          setStockPrices(priceData?.prices || {});
          stocks = investments
            .filter(i => i.type === 'stock')
            .reduce((sum, inv) => {
              const price = priceData?.prices?.[inv.name] || inv.current_value / (inv.amount || 1);
              return sum + (inv.amount * price);
            }, 0);
        } catch {
          stocks = investments
            .filter(i => i.type === 'stock')
            .reduce((sum, inv) => sum + inv.current_value, 0);
        }
      }

      // Calculate crypto value
      const cryptoHoldings = cryptoRes.data || [];
      const cryptoSymbols = cryptoHoldings.map(c => c.symbol);
      
      let crypto = 0;
      if (cryptoSymbols.length > 0) {
        try {
          const { data: priceData } = await supabase.functions.invoke('crypto-prices', {
            body: { symbols: cryptoSymbols }
          });
          setCryptoPrices(priceData?.prices || {});
          crypto = cryptoHoldings.reduce((sum, c) => {
            const usdPrice = priceData?.prices?.[c.symbol] || c.purchase_price;
            return sum + (c.amount * usdPrice * rate);
          }, 0);
        } catch {
          crypto = cryptoHoldings.reduce((sum, c) => sum + (c.amount * c.purchase_price * rate), 0);
        }
      }

      // Calculate business net
      const businessTransactions = businessRes.data || [];
      const business = businessTransactions.reduce((sum, b) => {
        return b.transaction_type === 'pemasukan' ? sum + Number(b.amount) : sum - Number(b.amount);
      }, 0);

      setAssets({ cash: Math.max(0, cash), stocks, crypto, business: Math.max(0, business) });
    } catch (error) {
      console.error('Error fetching net worth:', error);
      toast({ title: 'Error', description: 'Gagal memuat data net worth', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const netWorth = useMemo(() => {
    return assets.cash + assets.stocks + assets.crypto + assets.business - liabilities;
  }, [assets, liabilities]);

  const pieData = useMemo(() => [
    { name: 'Cash', value: assets.cash, icon: Wallet },
    { name: 'Stocks', value: assets.stocks, icon: Building2 },
    { name: 'Crypto', value: assets.crypto, icon: Bitcoin },
    { name: 'Business', value: assets.business, icon: PiggyBank },
  ].filter(d => d.value > 0), [assets]);

  // Simulated history data
  const historyData: NetWorthHistory[] = useMemo(() => {
    const data: NetWorthHistory[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const variance = 1 - (i * 0.05) + (Math.random() * 0.1);
      data.push({
        date: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
        value: netWorth * variance
      });
    }
    return data;
  }, [netWorth]);

  const formatCurrency = (value: number) => formatRupiah(value);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
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
        <h1 className="text-2xl sm:text-3xl font-bold">Net Worth</h1>
        <p className="text-muted-foreground mt-1">Pantau total aset dan liabilitas Anda</p>
      </div>

      {/* Main Net Worth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Net Worth</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">{formatCurrency(netWorth)}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-green-500 text-sm">
                    <ArrowUpRight size={16} />
                    +5.2% bulan ini
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground">Total Aset</p>
                  <p className="font-semibold text-green-500">
                    {formatCurrency(assets.cash + assets.stocks + assets.crypto + assets.business)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Total Liabilitas</p>
                  <p className="font-semibold text-white/70">{formatCurrency(liabilities)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Tren Net Worth</CardTitle>
              <CardDescription>6 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    />
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
                      fill="url(#netWorthGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Asset Allocation */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Alokasi Aset</CardTitle>
              <CardDescription>Distribusi portfolio Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center">Belum ada data aset</p>
                )}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cash', value: assets.cash, icon: Wallet, color: 'text-primary' },
          { label: 'Stocks', value: assets.stocks, icon: Building2, color: 'text-green-500' },
          { label: 'Crypto', value: assets.crypto, icon: Bitcoin, color: 'text-emerald-400' },
          { label: 'Business', value: assets.business, icon: PiggyBank, color: 'text-green-400' },
        ].map((asset, index) => (
          <motion.div
            key={asset.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <asset.icon className={`w-8 h-8 ${asset.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {netWorth > 0 ? ((asset.value / netWorth) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{asset.label}</p>
                <p className="text-lg font-bold mt-1">{formatCurrency(asset.value)}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NetWorthTracker;