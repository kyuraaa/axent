import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/utils';
import { CalendarIcon, DownloadIcon, FilterIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, MoreHorizontalIcon, PieChartIcon as PieChartLucideIcon, BarChart2Icon, Activity, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { format, isAfter, subDays } from 'date-fns';
import OverallFinancialAnalytics from './analytics/OverallFinancialAnalytics';
import AIFinancialInsights from './analytics/AIFinancialInsights';

// Reuse transaction shape from BudgetTracker
type TransactionType = 'income' | 'expense';
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO string
  transaction_type: TransactionType;
}
interface TrendItem {
  category: string;
  change: number;
  amount: number;
  previousAmount: number;
  trend: 'up' | 'down';
}
const CATEGORY_COLORS = ['#22c55e', '#0ea5e9', '#f97316', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b'];
const ExpenseAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [compareMode, setCompareMode] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);

  // Load user & transactions
  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
        const {
          data,
          error
        } = await supabase.from('budget_transactions').select('*').eq('user_id', user.id).order('date', {
          ascending: true
        });
        if (error) throw error;
        const mapped: Transaction[] = (data || []).map(item => ({
          id: item.id,
          description: item.description,
          amount: Number(item.amount),
          category: item.category,
          date: item.date,
          transaction_type: item.transaction_type as TransactionType
        }));
        setTransactions(mapped);
      } catch (error) {
        console.error('Error loading expense data', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data pengeluaran',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch AI-generated recommendations - comprehensive analysis
  useEffect(() => {
    const generateRecommendations = async () => {
      if (!userId || transactions.length === 0) return;
      try {
        setAiLoading(true);
        const {
          data,
          error
        } = await supabase.functions.invoke('financial-advisor-chat', {
          body: {
            userId,
            messages: [{
              role: 'user',
              content: 'Berikan 3 rekomendasi singkat dan spesifik dalam bentuk poin untuk mengoptimalkan pengeluaran saya berdasarkan data transaksi budget saya. Fokus pada kategori pengeluaran terbesar dan cara menguranginya.'
            }]
          }
        });
        if (error) throw error;
        if (data?.response) {
          setAiRecommendations(data.response as string);
        }
      } catch (error) {
        console.error('Error getting AI recommendations', error);
      } finally {
        setAiLoading(false);
      }
    };
    generateRecommendations();
  }, [userId, transactions.length]);
  const getRangeStartDate = (range: typeof timeRange) => {
    const today = new Date();
    switch (range) {
      case 'week':
        return subDays(today, 6);
      case 'month':
        return subDays(today, 29);
      case 'quarter':
        return subDays(today, 89);
      case 'year':
        return subDays(today, 364);
      default:
        return subDays(today, 29);
    }
  };
  const filteredTransactions = useMemo(() => {
    if (transactions.length === 0) return [] as Transaction[];
    const startDate = getRangeStartDate(timeRange);
    return transactions.filter(t => {
      const d = new Date(t.date);
      return isAfter(d, subDays(startDate, 1));
    });
  }, [transactions, timeRange]);
  const totalIncome = filteredTransactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = Math.max(totalIncome - totalExpenses, 0);

  // Chart data for income vs expenses vs savings
  const chartData = useMemo(() => {
    const today = new Date();
    const buildBuckets = (daysBack: number, stepDays: number, labelFormat: string) => {
      const buckets: {
        [key: string]: {
          expenses: number;
          income: number;
          savings: number;
        };
      } = {};
      for (let i = daysBack; i >= 0; i -= stepDays) {
        const date = subDays(today, i);
        const label = format(date, labelFormat);
        buckets[label] = {
          expenses: 0,
          income: 0,
          savings: 0
        };
      }
      filteredTransactions.forEach(t => {
        const d = new Date(t.date);
        const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > daysBack) return;
        const bucketIndex = Math.floor((daysBack - diffDays) / stepDays);
        const bucketOffset = daysBack - bucketIndex * stepDays;
        const bucketDate = subDays(today, bucketOffset);
        const label = format(bucketDate, labelFormat);
        if (!buckets[label]) {
          buckets[label] = {
            expenses: 0,
            income: 0,
            savings: 0
          };
        }
        if (t.transaction_type === 'expense') {
          buckets[label].expenses += t.amount;
        } else {
          buckets[label].income += t.amount;
        }
      });
      return Object.entries(buckets).map(([name, values]) => ({
        name,
        expenses: Number(values.expenses.toFixed(2)),
        income: Number(values.income.toFixed(2)),
        savings: Number(Math.max(values.income - values.expenses, 0).toFixed(2))
      }));
    };
    switch (timeRange) {
      case 'week':
        return buildBuckets(6, 1, 'EEE');
      case 'month':
        return buildBuckets(29, 3, 'dd MMM');
      case 'quarter':
        return buildBuckets(89, 7, 'dd MMM');
      case 'year':
        return buildBuckets(364, 30, 'MMM yy');
      default:
        return buildBuckets(29, 3, 'dd MMM');
    }
  }, [filteredTransactions, timeRange]);

  // Category breakdown based on filtered expenses
  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.transaction_type === 'expense');
    if (expenses.length === 0) return [] as {
      name: string;
      value: number;
      percentage: number;
      color: string;
    }[];
    const byCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    const total = Object.values(byCategory).reduce((sum, v) => sum + v, 0) || 1;
    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([category, value], index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: Number(value.toFixed(2)),
      percentage: Math.round(value / total * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));
  }, [filteredTransactions]);

  // Daily spending pattern for current month
  const dailySpendingData = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const expensesThisMonth = transactions.filter(t => {
      if (t.transaction_type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= startOfMonth && d <= endOfMonth;
    });
    const byDay: Record<number, number> = {};
    expensesThisMonth.forEach(t => {
      const d = new Date(t.date);
      const day = d.getDate();
      byDay[day] = (byDay[day] || 0) + t.amount;
    });
    const result = [] as {
      name: string;
      amount: number;
    }[];
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({
        name: day.toString(),
        amount: Number((byDay[day] || 0).toFixed(2))
      });
    }
    return result;
  }, [transactions]);

  // Trends: compare current 30 days vs previous 30 days by category
  const trends: TrendItem[] = useMemo(() => {
    if (transactions.length === 0) return [];
    const today = new Date();
    const currentStart = subDays(today, 29);
    const previousStart = subDays(currentStart, 30);
    const previousEnd = subDays(currentStart, 1);
    const currentExpenses = transactions.filter(t => {
      if (t.transaction_type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= currentStart && d <= today;
    });
    const previousExpenses = transactions.filter(t => {
      if (t.transaction_type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= previousStart && d <= previousEnd;
    });
    const sumByCategory = (items: Transaction[]) => items.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    const currentByCat = sumByCategory(currentExpenses);
    const prevByCat = sumByCategory(previousExpenses);
    const categories = Array.from(new Set([...Object.keys(currentByCat), ...Object.keys(prevByCat)]));
    const items: TrendItem[] = categories.map(category => {
      const amount = currentByCat[category] || 0;
      const previousAmount = prevByCat[category] || 0;
      if (previousAmount === 0 && amount === 0) return null as any;
      const change = previousAmount === 0 ? 100 : (amount - previousAmount) / previousAmount * 100;
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        change: Number(change.toFixed(1)),
        amount: Number(amount.toFixed(2)),
        previousAmount: Number(previousAmount.toFixed(2)),
        trend: change >= 0 ? 'up' : 'down'
      };
    }).filter(Boolean) as TrendItem[];
    return items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 4);
  }, [transactions]);
  const percentBudgetUsed = totalIncome > 0 ? Math.min(100, totalExpenses / totalIncome * 100) : 0;
  const percentSavingsGoal = totalIncome > 0 ? Math.min(100, savings / totalIncome * 100) : 0;

  // Date period label next to Export button based on filtered data
  const periodLabel = useMemo(() => {
    if (filteredTransactions.length === 0) {
      const today = new Date();
      return format(today, 'MMMM yyyy');
    }
    const dates = filteredTransactions.map(t => new Date(t.date)).sort((a, b) => a.getTime() - b.getTime());
    const start = dates[0];
    const end = dates[dates.length - 1];
    if (timeRange === 'week') {
      return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
    }
    if (timeRange === 'month') {
      return format(end, 'MMMM yyyy');
    }
    if (timeRange === 'quarter' || timeRange === 'year') {
      return `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`;
    }
    return format(end, 'MMMM yyyy');
  }, [filteredTransactions, timeRange]);
  const handleExport = () => {
    try {
      const rows = filteredTransactions.length ? filteredTransactions : transactions;
      if (!rows.length) {
        toast({
          title: 'Tidak ada data',
          description: 'Belum ada transaksi untuk diexport'
        });
        return;
      }
      const header = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
      const csvRows = [header.join(',')];
      rows.forEach(t => {
        const dateStr = format(new Date(t.date), 'yyyy-MM-dd');
        const typeStr = t.transaction_type;
        const row = [dateStr, typeStr, t.category, `"${t.description.replace(/"/g, '""')}"`, t.amount.toFixed(2)];
        csvRows.push(row.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Berhasil',
        description: 'Data pengeluaran berhasil diexport'
      });
    } catch (error) {
      console.error('Error exporting data', error);
      toast({
        title: 'Error',
        description: 'Gagal mengekspor data',
        variant: 'destructive'
      });
    }
  };
  if (loading) {
    return <div className="space-y-6 animate-fade-in">
        {/* Controls Skeleton */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-10" />
          </div>
        </div>

        {/* Expense Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Card key={i} className="bg-background/40 backdrop-blur-sm border-white/10">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-6" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-background/40 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center h-80">
                <Skeleton className="h-64 w-64 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spending Trends Skeleton */}
        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="flex items-center justify-between p-4 border rounded-lg border-white/10">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-20 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>)}
          </CardContent>
        </Card>

        {/* Daily Spending Pattern Skeleton */}
        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <Skeleton className="h-6 w-48 mb-1" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-6">
      {/* Overall Financial Analytics */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Financial Overview</h2>
        <p className="text-sm text-muted-foreground">Ringkasan keseluruhan kondisi keuangan Anda</p>
      </div>
      <OverallFinancialAnalytics />

      {/* AI Insights Section */}
      <AIFinancialInsights />

      {/* Expense Analytics Section */}
      <Separator className="my-8 bg-white/10" />
      
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">Expense Analytics</h2>
          <Tabs value={timeRange} onValueChange={val => setTimeRange(val as typeof timeRange)}>
            <TabsList className="bg-background/40">
              <TabsTrigger value="week" className={timeRange === 'week' ? 'bg-budgify-500 text-white' : ''}>
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className={timeRange === 'month' ? 'bg-budgify-500 text-white' : ''}>
                Month
              </TabsTrigger>
              <TabsTrigger value="quarter" className={timeRange === 'quarter' ? 'bg-budgify-500 text-white' : ''}>
                Quarter
              </TabsTrigger>
              <TabsTrigger value="year" className={timeRange === 'year' ? 'bg-budgify-500 text-white' : ''}>
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1 bg-card/40 border-white/10">
            <CalendarIcon size={14} />
            {periodLabel}
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 bg-card/40 border-white/10" onClick={handleExport}>
            <DownloadIcon size={14} />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-card/40 border-white/10">
                <FilterIcon size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Filter by Date</DropdownMenuItem>
              <DropdownMenuItem>Filter by Category</DropdownMenuItem>
              <DropdownMenuItem>Filter by Amount</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expense Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Expenses</CardTitle>
            <CardDescription>Current {timeRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="text-3xl font-bold">
                {formatRupiah(totalExpenses)}
              </div>
              <div className="flex items-center text-budgify-500 text-sm mt-1">
                <TrendingDownIcon size={16} className="mr-1" />
                <span>{percentBudgetUsed.toFixed(1)}% of income used</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Budget (Income)</p>
                <p className="text-lg font-medium">{formatRupiah(totalIncome)}</p>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-budgify-500 rounded-full" style={{
                  width: `${percentBudgetUsed}%`
                }} />
                </div>
                <p className="text-xs text-budgify-500">{percentBudgetUsed.toFixed(1)}% used</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Savings</p>
                <p className="text-lg font-medium">{formatRupiah(savings)}</p>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{
                  width: `${percentSavingsGoal}%`
                }} />
                </div>
                <p className="text-xs text-cyan-500">{percentSavingsGoal.toFixed(1)}% of goal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Expense Trend</CardTitle>
                <CardDescription>Compare income, expenses & savings</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className={cn('text-xs h-7 px-2 border-white/10', compareMode ? 'bg-budgify-500/20' : 'bg-card/40')} onClick={() => setCompareMode(!compareMode)}>
                  Compare
                </Button>
                <Select defaultValue="area" disabled>
                  <SelectTrigger className="h-7 w-[110px] text-xs bg-card/40 border-white/10">
                    <SelectValue placeholder="Chart type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0
              }}>
                  <defs>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    {compareMode && <>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </>}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{
                  fill: '#888888'
                }} axisLine={{
                  stroke: '#444444'
                }} />
                  <YAxis tick={{
                  fill: '#888888'
                }} axisLine={{
                  stroke: '#444444'
                }} />
                  <Tooltip contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }} />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                  {compareMode && <>
                      <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="savings" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSavings)" strokeWidth={2} />
                    </>}
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Spending & Daily */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
            <CardDescription>Breakdown of your expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                      {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={value => [formatRupiah(Number(value)), 'Amount']} contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 sm:min-w-[140px]">
                {categoryData.slice(0, 5).map(category => <div key={category.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{
                      backgroundColor: category.color
                    }}></span>
                        {category.name}
                      </span>
                      <span className="font-medium">{category.percentage}%</span>
                    </div>
                    <Progress value={category.percentage} className="h-1.5 bg-muted" />
                  </div>)}
                {categoryData.length > 5 && <Button variant="ghost" size="sm" className="w-full text-xs mt-2">
                    Show all categories
                  </Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Daily Spending</CardTitle>
            <CardDescription>Your spending pattern throughout the month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpendingData} margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0
              }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" tick={{
                  fill: '#888888'
                }} axisLine={{
                  stroke: '#444444'
                }} tickLine={false} interval={4} />
                  <YAxis tick={{
                  fill: '#888888'
                }} axisLine={{
                  stroke: '#444444'
                }} tickLine={false} />
                  <Tooltip formatter={value => [formatRupiah(Number(value)), 'Spent']} contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spending Insights */}
      <Card className="bg-background/40 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Spending Insights</CardTitle>
          <CardDescription>Analysis of your spending habits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trends section */}
            <div>
              <h3 className="text-sm font-medium mb-4">Notable Changes from Last Month</h3>
              <div className="space-y-4">
                {trends.length === 0 && <p className="text-sm text-muted-foreground">
                    Belum ada cukup data untuk menampilkan perubahan pengeluaran.
                  </p>}
                {trends.map(item => <div key={item.category} className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', item.trend === 'up' ? 'bg-red-500/20' : 'bg-budgify-500/20')}>
                        {item.trend === 'up' ? <TrendingUpIcon size={18} className="text-red-500" /> : <TrendingDownIcon size={18} className="text-budgify-500" />}
                      </div>
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">
                          ${item.amount} pada periode ini
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('font-medium flex items-center justify-end', item.trend === 'up' ? 'text-red-500' : 'text-budgify-500')}>
                        {item.trend === 'up' ? '+' : ''}
                        {item.change}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        dari ${item.previousAmount}
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>

            {/* Recommendations section */}
            <div>
              <h3 className="text-sm font-medium mb-4">AI-Generated Recommendations</h3>
              <div className="space-y-4">
                {aiLoading && <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>}

                {!aiLoading && !aiRecommendations && <p className="text-sm text-muted-foreground">
                    Tambahkan beberapa transaksi pengeluaran terlebih dahulu untuk mendapatkan rekomendasi AI yang personal.
                  </p>}

                {!aiLoading && aiRecommendations && (() => {
                const sections = aiRecommendations.split(/\n{2,}/).map(s => s.trim()).filter(Boolean).slice(0, 3);
                const icons = [Activity, PieChartLucideIcon, BarChart2Icon];
                return sections.map((text, index) => {
                  const Icon = icons[index] || Activity;
                  return <div key={index} className={cn('p-4 rounded-lg border', index === 0 ? 'bg-cyan-500/10 border-cyan-500/20' : index === 1 ? 'bg-budgify-500/10 border-budgify-500/20' : 'bg-purple-500/10 border-purple-500/20')}>
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5', index === 0 ? 'text-cyan-500' : index === 1 ? 'text-budgify-500' : 'text-purple-500')}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground whitespace-pre-line">{text}</p>
                            </div>
                          </div>
                        </div>;
                });
              })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default ExpenseAnalytics;