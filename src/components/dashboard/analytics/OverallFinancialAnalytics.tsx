import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Bitcoin, Briefcase, PiggyBank, Target } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#22c55e', '#0ea5e9', '#f97316', '#8b5cf6', '#ec4899', '#f43f5e'];

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  stocksValue: number;
  stocksGain: number;
  cryptoValue: number;
  cryptoGain: number;
  businessRevenue: number;
  businessExpenses: number;
  businessProfit: number;
  totalNetWorth: number;
}

const OverallFinancialAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        // Fetch all financial data in parallel
        const [budgetRes, investmentsRes, cryptoRes, businessRes] = await Promise.all([
          supabase.from('budget_transactions').select('*').eq('user_id', user.id),
          supabase.from('investments').select('*').eq('user_id', user.id),
          supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
          supabase.from('business_finances').select('*').eq('user_id', user.id)
        ]);

        // Calculate budget summary
        const budgetTx = budgetRes.data || [];
        const totalIncome = budgetTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const totalExpenses = budgetTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const netSavings = totalIncome - totalExpenses;

        // Calculate investments summary
        const investments = investmentsRes.data || [];
        const stocksInvested = investments.reduce((s, inv) => s + Number(inv.amount), 0);
        const stocksValue = investments.reduce((s, inv) => s + Number(inv.current_value), 0);
        const stocksGain = stocksValue - stocksInvested;

        // Calculate crypto summary
        const cryptoHoldings = cryptoRes.data || [];
        const cryptoInvested = cryptoHoldings.reduce((s, h) => s + (Number(h.amount) * Number(h.purchase_price)), 0);
        // Note: For accurate crypto value, we'd need to fetch current prices, but for analytics summary we use purchase values
        const cryptoValue = cryptoInvested; // Will be updated with real-time prices if available
        const cryptoGain = 0; // Will be calculated with real-time prices

        // Calculate business summary
        const businessTx = businessRes.data || [];
        const businessRevenue = businessTx.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const businessExpenses = businessTx.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const businessProfit = businessRevenue - businessExpenses;

        // Calculate total net worth
        const totalNetWorth = netSavings + stocksValue + cryptoValue + businessProfit;

        setSummary({
          totalIncome,
          totalExpenses,
          netSavings,
          stocksValue,
          stocksGain,
          cryptoValue,
          cryptoGain,
          businessRevenue,
          businessExpenses,
          businessProfit,
          totalNetWorth
        });

      } catch (error) {
        console.error('Error loading financial data', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data keuangan',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const distributionData = useMemo(() => {
    if (!summary) return [];
    
    const data = [];
    if (summary.netSavings > 0) data.push({ name: 'Tabungan', value: summary.netSavings, color: COLORS[0] });
    if (summary.stocksValue > 0) data.push({ name: 'Saham', value: summary.stocksValue, color: COLORS[1] });
    if (summary.cryptoValue > 0) data.push({ name: 'Crypto', value: summary.cryptoValue, color: COLORS[2] });
    if (summary.businessProfit > 0) data.push({ name: 'Bisnis', value: summary.businessProfit, color: COLORS[3] });
    
    return data;
  }, [summary]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-background/40 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-background/40 backdrop-blur-sm border-white/10">
        <CardContent className="p-6 text-center text-muted-foreground">
          Belum ada data keuangan tersedia
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => formatRupiah(value);

  const cards = [
    {
      title: 'Total Net Worth',
      value: summary.totalNetWorth,
      icon: DollarSign,
      color: 'text-green-500',
      description: 'Total kekayaan bersih'
    },
    {
      title: 'Personal Finance',
      value: summary.netSavings,
      icon: PiggyBank,
      color: summary.netSavings >= 0 ? 'text-green-500' : 'text-red-500',
      description: `Income: ${formatCurrency(summary.totalIncome)}`
    },
    {
      title: 'Investasi Saham',
      value: summary.stocksValue,
      icon: TrendingUp,
      color: summary.stocksGain >= 0 ? 'text-green-500' : 'text-red-500',
      description: `Gain/Loss: ${formatCurrency(summary.stocksGain)}`
    },
    {
      title: 'Crypto Holdings',
      value: summary.cryptoValue,
      icon: Bitcoin,
      color: 'text-orange-500',
      description: 'Total nilai crypto'
    },
    {
      title: 'Bisnis',
      value: summary.businessProfit,
      icon: Briefcase,
      color: summary.businessProfit >= 0 ? 'text-green-500' : 'text-red-500',
      description: `Revenue: ${formatCurrency(summary.businessRevenue)}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="bg-background/40 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution Chart */}
      {distributionData.length > 0 && (
        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle>Distribusi Kekayaan</CardTitle>
            <CardDescription>Proporsi aset keuangan Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverallFinancialAnalytics;
