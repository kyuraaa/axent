import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, AlertTriangle, TrendingDown, TrendingUp, Wallet, CreditCard, ShoppingCart, Home, Car, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/utils';

interface Insight {
  id: string;
  type: 'anomaly' | 'warning' | 'opportunity' | 'trend';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  percentageChange?: number;
}

const SmartInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const generatedInsights: Insight[] = [];

      if (transactions && transactions.length > 0) {
        // Analyze spending patterns
        const categoryTotals: Record<string, number> = {};
        transactions.forEach(t => {
          if (t.transaction_type === 'expense') {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
          }
        });

        // Find highest spending category
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        if (sortedCategories.length > 0) {
          generatedInsights.push({
            id: '1',
            type: 'trend',
            severity: 'medium',
            title: 'Kategori Pengeluaran Tertinggi',
            description: `Kategori ${sortedCategories[0][0]} menyumbang pengeluaran terbesar Anda`,
            category: sortedCategories[0][0],
            amount: sortedCategories[0][1]
          });
        }

        // Check for large transactions
        const largeTransactions = transactions.filter(t => t.amount > 1000000 && t.transaction_type === 'expense');
        if (largeTransactions.length > 0) {
          generatedInsights.push({
            id: '2',
            type: 'anomaly',
            severity: 'high',
            title: 'Transaksi Besar Terdeteksi',
            description: `${largeTransactions.length} transaksi besar (>Rp 1.000.000) dalam periode ini`,
            amount: largeTransactions.reduce((sum, t) => sum + t.amount, 0)
          });
        }

        // Income vs Expense ratio
        const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        if (totalExpense > totalIncome * 0.8) {
          generatedInsights.push({
            id: '3',
            type: 'warning',
            severity: 'high',
            title: 'Rasio Pengeluaran Tinggi',
            description: 'Pengeluaran Anda mencapai lebih dari 80% dari pemasukan',
            percentageChange: (totalExpense / totalIncome) * 100
          });
        } else {
          generatedInsights.push({
            id: '4',
            type: 'opportunity',
            severity: 'low',
            title: 'Kesempatan Menabung',
            description: `Anda memiliki surplus ${((1 - totalExpense / totalIncome) * 100).toFixed(0)}% yang bisa dialokasikan untuk investasi`,
            percentageChange: ((1 - totalExpense / totalIncome) * 100)
          });
        }
      }

      // Add default insights if no data
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: 'default',
          type: 'opportunity',
          severity: 'low',
          title: 'Mulai Tracking Keuangan',
          description: 'Tambahkan transaksi untuk mendapatkan insight yang lebih akurat'
        });
      }

      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return AlertTriangle;
      case 'warning': return TrendingDown;
      case 'opportunity': return TrendingUp;
      default: return Sparkles;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'anomaly': return 'text-white/70 bg-white/10';
      case 'warning': return 'text-white/70 bg-white/10';
      case 'opportunity': return 'text-green-500 bg-green-500/10';
      default: return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="secondary">Penting</Badge>;
      case 'medium': return <Badge variant="secondary">Perhatikan</Badge>;
      default: return <Badge variant="outline">Info</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Smart Insights</h1>
            <p className="text-muted-foreground">Deteksi anomali pengeluaran, budget leak, dan cashflow warning</p>
          </div>
        </div>
        <Button onClick={generateInsights} disabled={loading}>
          {loading ? 'Menganalisis...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          const Icon = getInsightIcon(insight.type);
          const colorClass = getInsightColor(insight.type);
          
          return (
            <Card key={insight.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{insight.title}</h3>
                      {getSeverityBadge(insight.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.amount && (
                      <p className="text-lg font-bold mt-2">
                        {formatRupiah(insight.amount)}
                      </p>
                    )}
                    {insight.percentageChange && (
                      <p className="text-sm font-medium mt-1">
                        {insight.percentageChange.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Analisis per Kategori</CardTitle>
          <CardDescription>Breakdown pengeluaran berdasarkan kategori</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShoppingCart, name: 'Belanja', color: 'text-emerald-500' },
              { icon: Utensils, name: 'Makanan', color: 'text-green-500' },
              { icon: Home, name: 'Rumah', color: 'text-emerald-400' },
              { icon: Car, name: 'Transport', color: 'text-green-400' }
            ].map((cat, index) => (
              <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                <cat.icon className={`w-8 h-8 mx-auto mb-2 ${cat.color}`} />
                <p className="text-sm font-medium">{cat.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartInsights;