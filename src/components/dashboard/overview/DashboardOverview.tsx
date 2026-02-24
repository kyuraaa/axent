import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import SummaryCards from './SummaryCards';
import QuickActions from './QuickActions';
import FinancialHealthScore from './FinancialHealthScore';
import RecentActivity from './RecentActivity';
import OverviewCharts from './OverviewCharts';
import { toast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/lib/utils';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  transaction_type: 'income' | 'expense';
}

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
  coin_name: string;
  symbol: string;
  amount: number;
  purchase_price: number;
  purchase_date: string;
}

interface BusinessTransaction {
  id: string;
  business_name: string;
  category: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  description: string | null;
}

interface OverviewData {
  transactions: Transaction[];
  investments: Investment[];
  cryptoHoldings: CryptoHolding[];
  businessTransactions: BusinessTransaction[];
  stockPrices: Record<string, number>;
  cryptoPrices: Record<string, number>;
  exchangeRate: number;
}

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData>({
    transactions: [],
    investments: [],
    cryptoHoldings: [],
    businessTransactions: [],
    stockPrices: {},
    cryptoPrices: {},
    exchangeRate: 15700
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const isTester = localStorage.getItem('isTester') === 'true';
      let user: any = null;
      let userName = 'User';

      if (isTester) {
        user = JSON.parse(localStorage.getItem('testerUser') || '{}');
        userName = 'Tester User';
      } else {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
        if (!user) return;

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        userName = profile?.full_name || user.email?.split('@')[0] || 'User';
      }

      setUserName(userName);

      if (isTester) {
        // Provide mock data for tester (reset to 0)
        setData({
          transactions: [],
          investments: [],
          cryptoHoldings: [],
          businessTransactions: [],
          stockPrices: {},
          cryptoPrices: {},
          exchangeRate: 15700
        });
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [transactionsRes, investmentsRes, cryptoRes, businessRes, exchangeRes] = await Promise.all([
        supabase.from('budget_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
        supabase.from('business_finances').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false }),
        supabase.functions.invoke('exchange-rate')
      ]);

      const transactions = (transactionsRes.data || []).map(t => ({
        ...t,
        amount: Number(t.amount)
      })) as Transaction[];

      const investments = (investmentsRes.data || []).map(i => ({
        ...i,
        amount: Number(i.amount),
        current_value: Number(i.current_value)
      })) as Investment[];

      const cryptoHoldings = (cryptoRes.data || []).map(c => ({
        ...c,
        amount: Number(c.amount),
        purchase_price: Number(c.purchase_price)
      })) as CryptoHolding[];

      const businessTransactions = (businessRes.data || []).map(b => ({
        ...b,
        amount: Number(b.amount)
      })) as BusinessTransaction[];

      const exchangeRate = exchangeRes.data?.rate || 15700;

      // Fetch real-time prices
      let stockPrices: Record<string, number> = {};
      let cryptoPrices: Record<string, number> = {};

      if (investments.length > 0) {
        const stockSymbols = investments.filter(i => i.type === 'stock').map(i => i.name);
        if (stockSymbols.length > 0) {
          try {
            const { data: priceData } = await supabase.functions.invoke('stock-prices', {
              body: { symbols: stockSymbols }
            });
            stockPrices = priceData?.prices || {};
          } catch (e) {
            console.warn('Failed to fetch stock prices');
          }
        }
      }

      if (cryptoHoldings.length > 0) {
        const cryptoSymbols = cryptoHoldings.map(c => c.symbol);
        if (cryptoSymbols.length > 0) {
          try {
            const { data: priceData } = await supabase.functions.invoke('crypto-prices', {
              body: { symbols: cryptoSymbols }
            });
            cryptoPrices = priceData?.prices || {};
          } catch (e) {
            console.warn('Failed to fetch crypto prices');
          }
        }
      }

      setData({
        transactions,
        investments,
        cryptoHoldings,
        businessTransactions,
        stockPrices,
        cryptoPrices,
        exchangeRate
      });
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter current month transactions
    const currentMonthTransactions = data.transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Calculate total cash from all transactions
    const totalCash = data.transactions.reduce((sum, t) => {
      return t.transaction_type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);

    // Calculate stock portfolio value
    const stockValue = data.investments
      .filter(i => i.type === 'stock')
      .reduce((sum, stock) => {
        const price = data.stockPrices[stock.name] || stock.current_value / (stock.amount || 1);
        return sum + (stock.amount * price);
      }, 0);

    // Calculate crypto portfolio value (in IDR)
    const cryptoValue = data.cryptoHoldings.reduce((sum, crypto) => {
      const usdPrice = data.cryptoPrices[crypto.symbol] || crypto.purchase_price;
      return sum + (crypto.amount * usdPrice * data.exchangeRate);
    }, 0);

    const investmentValue = stockValue + cryptoValue;

    // Net worth (cash + investments)
    const netWorth = Math.max(0, totalCash) + investmentValue;

    // Business profit this month
    const currentMonthBusiness = data.businessTransactions.filter(b => {
      const date = new Date(b.transaction_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const businessIncome = currentMonthBusiness
      .filter(b => b.transaction_type === 'pemasukan')
      .reduce((sum, b) => sum + b.amount, 0);

    const businessExpenses = currentMonthBusiness
      .filter(b => b.transaction_type === 'pengeluaran')
      .reduce((sum, b) => sum + b.amount, 0);

    const businessProfit = businessIncome - businessExpenses;

    // Calculate emergency fund months
    const avgMonthlyExpenses = monthlyExpenses || 1;
    const emergencyFundMonths = totalCash > 0 ? totalCash / avgMonthlyExpenses : 0;

    // Diversification ratio
    const totalAssets = Math.max(1, netWorth);
    const diversification = {
      stocks: stockValue / totalAssets,
      crypto: cryptoValue / totalAssets,
      cash: Math.max(0, totalCash) / totalAssets
    };

    return {
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      investmentValue,
      businessProfit,
      totalCash,
      stockValue,
      cryptoValue,
      emergencyFundMonths,
      diversification
    };
  }, [data]);

  // Calculate financial health score
  const healthScore = useMemo(() => {
    let score = 0;

    // Savings Rate (30 points max)
    if (metrics.savingsRate >= 20) score += 30;
    else if (metrics.savingsRate >= 10) score += 20;
    else if (metrics.savingsRate >= 5) score += 10;
    else if (metrics.savingsRate > 0) score += (metrics.savingsRate / 5) * 10;

    // Emergency Fund (20 points max)
    if (metrics.emergencyFundMonths >= 6) score += 20;
    else if (metrics.emergencyFundMonths >= 3) score += 15;
    else score += Math.min(20, (metrics.emergencyFundMonths / 6) * 20);

    // Diversification (20 points max)
    const hasStocks = metrics.stockValue > 0;
    const hasCrypto = metrics.cryptoValue > 0;
    const hasCash = metrics.totalCash > 0;
    const assetTypes = [hasStocks, hasCrypto, hasCash].filter(Boolean).length;
    score += (assetTypes / 3) * 20;

    // Budget Adherence (15 points) - simplified: positive cash flow
    if (metrics.monthlyIncome >= metrics.monthlyExpenses) score += 15;
    else if (metrics.monthlyIncome >= metrics.monthlyExpenses * 0.8) score += 10;
    else score += 5;

    // Investment Activity (15 points)
    if (metrics.investmentValue > 0) score += 15;
    else score += 5;

    return Math.round(Math.min(100, Math.max(0, score)));
  }, [metrics]);

  const scoreBreakdown = useMemo(() => [
    { label: 'Tingkat Tabungan', value: Math.min(30, metrics.savingsRate >= 20 ? 30 : metrics.savingsRate >= 10 ? 20 : metrics.savingsRate >= 5 ? 10 : (metrics.savingsRate / 5) * 10), max: 30 },
    { label: 'Dana Darurat', value: Math.min(20, metrics.emergencyFundMonths >= 6 ? 20 : metrics.emergencyFundMonths >= 3 ? 15 : (metrics.emergencyFundMonths / 6) * 20), max: 20 },
    { label: 'Diversifikasi', value: Math.min(20, ([metrics.stockValue > 0, metrics.cryptoValue > 0, metrics.totalCash > 0].filter(Boolean).length / 3) * 20), max: 20 },
    { label: 'Kepatuhan Anggaran', value: metrics.monthlyIncome >= metrics.monthlyExpenses ? 15 : metrics.monthlyIncome >= metrics.monthlyExpenses * 0.8 ? 10 : 5, max: 15 },
    { label: 'Aktivitas Investasi', value: metrics.investmentValue > 0 ? 15 : 5, max: 15 },
  ], [metrics]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Selamat datang, {userName}! 👋</h1>
        <p className="text-white/60 mt-1">Berikut ringkasan keuangan Anda</p>
      </motion.div>

      {/* Financial Health Score */}
      <FinancialHealthScore score={healthScore} breakdown={scoreBreakdown} />

      {/* Summary Cards */}
      <SummaryCards metrics={metrics} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity
          transactions={data.transactions.slice(0, 5)}
          investments={data.investments.slice(0, 2)}
          cryptoHoldings={data.cryptoHoldings.slice(0, 2)}
          businessTransactions={data.businessTransactions.slice(0, 2)}
        />

        {/* Charts */}
        <OverviewCharts
          transactions={data.transactions}
          netWorth={metrics.netWorth}
          investmentValue={metrics.investmentValue}
        />
      </div>
    </motion.div>
  );
};

const OverviewSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-8 w-64 mb-2" />
      <Skeleton className="h-5 w-48" />
    </div>
    <Skeleton className="h-40 w-full rounded-xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-16 w-full rounded-xl" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  </div>
);

export default DashboardOverview;
