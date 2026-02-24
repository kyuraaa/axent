import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ForecastData {
  month: string;
  actual?: number;
  predicted: number;
}

const Forecasting = () => {
  const [timeframe, setTimeframe] = useState('6months');
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [summary, setSummary] = useState({
    avgMonthlyExpense: 0,
    predictedNextMonth: 0,
    trend: 'stable' as 'up' | 'down' | 'stable',
    trendPercentage: 0
  });

  useEffect(() => {
    generateForecast();
  }, [timeframe]);

  const generateForecast = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: transactions } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .order('date', { ascending: true });

      // Group by month
      const monthlyData: Record<string, number> = {};
      transactions?.forEach(t => {
        const month = t.date.substring(0, 7);
        monthlyData[month] = (monthlyData[month] || 0) + t.amount;
      });

      // Generate forecast based on historical data
      const months = Object.keys(monthlyData).sort();
      const values = months.map(m => monthlyData[m]);
      
      // Calculate average and trend
      const avgExpense = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 5000000;
      
      // Simple linear regression for trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;
      
      if (values.length >= 2) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        trendPercentage = ((avgSecond - avgFirst) / avgFirst) * 100;
        trend = trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable';
      }

      // Generate forecast data
      const data: ForecastData[] = [];
      const currentDate = new Date();
      const numMonths = timeframe === '3months' ? 3 : timeframe === '6months' ? 6 : 12;

      for (let i = -3; i <= numMonths; i++) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() + i);
        const monthKey = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const monthDbKey = date.toISOString().substring(0, 7);

        if (i <= 0 && monthlyData[monthDbKey]) {
          data.push({
            month: monthKey,
            actual: monthlyData[monthDbKey],
            predicted: monthlyData[monthDbKey]
          });
        } else {
          // Predict future values with some variation
          const variation = (Math.random() - 0.5) * 0.2;
          const predicted = avgExpense * (1 + (trendPercentage / 100) * (i / 3)) * (1 + variation);
          data.push({
            month: monthKey,
            predicted: Math.round(predicted)
          });
        }
      }

      setForecastData(data);
      setSummary({
        avgMonthlyExpense: Math.round(avgExpense),
        predictedNextMonth: Math.round(avgExpense * (1 + trendPercentage / 100)),
        trend,
        trendPercentage: Math.abs(trendPercentage)
      });
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `Rp ${(value / 1000000).toFixed(1)}jt`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Forecasting</h1>
            <p className="text-muted-foreground">Proyeksi pengeluaran dan estimasi cashflow berdasarkan pola historis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Bulan</SelectItem>
              <SelectItem value="6months">6 Bulan</SelectItem>
              <SelectItem value="12months">12 Bulan</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={generateForecast}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Pengeluaran</p>
                <p className="text-2xl font-bold mt-1">
                  Rp {summary.avgMonthlyExpense.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">per bulan</p>
              </div>
              <DollarSign className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prediksi Bulan Depan</p>
                <p className="text-2xl font-bold mt-1">
                  Rp {summary.predictedNextMonth.toLocaleString('id-ID')}
                </p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${
                  summary.trend === 'up' ? 'text-red-500' : summary.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {summary.trend === 'up' && <ArrowUp className="w-3 h-3" />}
                  {summary.trend === 'down' && <ArrowDown className="w-3 h-3" />}
                  <span>{summary.trendPercentage.toFixed(1)}% dari rata-rata</span>
                </div>
              </div>
              <Calendar className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trend Pengeluaran</p>
                <p className={`text-2xl font-bold mt-1 ${
                  summary.trend === 'up' ? 'text-red-500' : summary.trend === 'down' ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {summary.trend === 'up' ? 'Naik' : summary.trend === 'down' ? 'Turun' : 'Stabil'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.trendPercentage.toFixed(1)}% perubahan
                </p>
              </div>
              <TrendingUp className={`w-10 h-10 opacity-50 ${
                summary.trend === 'up' ? 'text-red-500' : summary.trend === 'down' ? 'text-green-500' : 'text-yellow-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Proyeksi Pengeluaran</CardTitle>
          <CardDescription>Data aktual dan prediksi berdasarkan pola historis</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <YAxis tickFormatter={formatCurrency} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorActual)"
                  name="Aktual"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#colorPredicted)"
                  name="Prediksi"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Insight Forecasting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-sm">
                📊 Berdasarkan pola pengeluaran Anda, diperkirakan total pengeluaran dalam{' '}
                {timeframe === '3months' ? '3' : timeframe === '6months' ? '6' : '12'} bulan ke depan adalah{' '}
                <strong>Rp {(summary.predictedNextMonth * (timeframe === '3months' ? 3 : timeframe === '6months' ? 6 : 12)).toLocaleString('id-ID')}</strong>
              </p>
            </div>
            {summary.trend === 'up' && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">
                  ⚠️ Trend pengeluaran Anda cenderung naik. Pertimbangkan untuk meninjau kategori pengeluaran terbesar.
                </p>
              </div>
            )}
            {summary.trend === 'down' && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400">
                  ✅ Bagus! Trend pengeluaran Anda cenderung turun. Terus pertahankan pola pengeluaran ini.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Forecasting;
