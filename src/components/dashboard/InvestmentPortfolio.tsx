import React, { useState, useEffect } from 'react';
import { LineChart as LineChartIcon, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatRupiah } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StocksTab } from './investments/StocksTab';
import { CryptoTab } from './investments/CryptoTab';
import { CurrencyTab } from './investments/CurrencyTab';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16'];

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
}

interface CryptoHolding {
  id: string;
  coin_id: string;
  coin_name: string;
  symbol: string;
  amount: number;
  purchase_price: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

const InvestmentPortfolio = () => {
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [cryptoHoldings, setCryptoHoldings] = useState<CryptoHolding[]>([]);
  const [exchangeRate, setExchangeRate] = useState(15700);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>("stocks");

  // Calculate portfolio values
  const stocksValue = investments.reduce((sum, inv) => {
    const currentPrice = stockPrices[inv.type];
    return sum + (currentPrice ? currentPrice * (inv.amount / inv.current_value * inv.amount) : inv.current_value);
  }, 0);

  const cryptoValue = cryptoHoldings.reduce((sum, holding) => {
    const currentPrice = cryptoPrices[holding.symbol];
    return sum + (currentPrice ? currentPrice * holding.amount : holding.purchase_price);
  }, 0);

  const totalPortfolioValue = stocksValue + cryptoValue;

  useEffect(() => {
    fetchData();
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (cryptoHoldings.length > 0) {
      fetchCryptoPrices();
      const interval = setInterval(fetchCryptoPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [cryptoHoldings, exchangeRate]);

  useEffect(() => {
    if (investments.length > 0) {
      fetchStockPrices();
      const interval = setInterval(fetchStockPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [investments]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch stocks
      const { data: stocksData, error: stocksError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (stocksError) throw stocksError;
      setInvestments(stocksData || []);

      // Fetch crypto
      const { data: cryptoData, error: cryptoError } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cryptoError) throw cryptoError;
      setCryptoHoldings(cryptoData || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data investasi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rate');
      if (error) throw error;
      if (data?.rate) {
        setExchangeRate(data.rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }
  };

  const fetchCryptoPrices = async () => {
    try {
      const symbols = [...new Set(cryptoHoldings.map(h => h.symbol))];
      if (symbols.length === 0) return;

      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.prices) {
        const pricesInIDR: Record<string, number> = {};
        Object.keys(data.prices).forEach(symbol => {
          pricesInIDR[symbol] = data.prices[symbol] * exchangeRate;
        });
        setCryptoPrices(pricesInIDR);
      }
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };

  const fetchStockPrices = async () => {
    try {
      const symbols = [...new Set(investments.map(inv => inv.type))];
      if (symbols.length === 0) return;

      const { data, error } = await supabase.functions.invoke('stock-prices', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.prices) {
        setStockPrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    }
  };

  // Calculate totals for old sections
  const totalStockValue = investments.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalCryptoValue = cryptoHoldings.reduce((sum, h) => {
    const currentPrice = cryptoPrices[h.symbol] || Number(h.purchase_price);
    return sum + (currentPrice * Number(h.amount));
  }, 0);

  const totalCurrentValue = totalStockValue + totalCryptoValue;

  // Generate asset allocation
  const assetAllocation = React.useMemo(() => {
    const allocations: Array<{ name: string; value: number; color: string }> = [];
    
    // Stocks
    const stockTypeMap = new Map<string, number>();
    investments.forEach(inv => {
      const current = stockTypeMap.get(inv.type) || 0;
      stockTypeMap.set(inv.type, current + Number(inv.current_value));
    });
    
    stockTypeMap.forEach((value, type) => {
      allocations.push({
        name: type,
        value: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
        color: COLORS[allocations.length % COLORS.length]
      });
    });

    // Crypto
    const cryptoTypeMap = new Map<string, number>();
    cryptoHoldings.forEach(h => {
      const currentPrice = cryptoPrices[h.symbol] || Number(h.purchase_price);
      const value = currentPrice * Number(h.amount);
      const current = cryptoTypeMap.get(h.symbol) || 0;
      cryptoTypeMap.set(h.symbol, current + value);
    });

    cryptoTypeMap.forEach((value, symbol) => {
      allocations.push({
        name: symbol,
        value: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
        color: COLORS[allocations.length % COLORS.length]
      });
    });

    return allocations;
  }, [investments, cryptoHoldings, cryptoPrices, totalCurrentValue]);

  // Generate portfolio history
  const portfolioHistoryData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 8; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const growthFactor = 1 - (i * 0.02);
      data.push({
        month: months[monthIndex],
        value: Math.round(totalCurrentValue * growthFactor)
      });
    }
    
    return data;
  }, [totalCurrentValue]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Portfolio Value Summary */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Total Portfolio Value</div>
            <div className="text-3xl font-bold text-primary">
              Rp{formatRupiah(totalPortfolioValue, false)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Stocks Value</div>
            <div className="text-3xl font-bold">
              Rp{formatRupiah(stocksValue, false)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Crypto Value</div>
            <div className="text-3xl font-bold">
              Rp{formatRupiah(cryptoValue, false)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different asset types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background/40">
          <TabsTrigger 
            value="stocks" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Stocks
          </TabsTrigger>
          <TabsTrigger 
            value="crypto" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Crypto
          </TabsTrigger>
          <TabsTrigger 
            value="currency" 
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Currency Rate
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="stocks">
            <StocksTab 
              loading={loading} 
              investments={investments} 
              onRefresh={fetchData}
            />
          </TabsContent>
          
          <TabsContent value="crypto">
            <CryptoTab 
              loading={loading} 
              holdings={cryptoHoldings} 
              onRefresh={fetchData}
            />
          </TabsContent>
          
          <TabsContent value="currency">
            <CurrencyTab loading={loading} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default InvestmentPortfolio;
