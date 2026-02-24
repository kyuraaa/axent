import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, Tooltip,
  LineChart, Line
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  transaction_type: 'income' | 'expense';
}

interface OverviewChartsProps {
  transactions: Transaction[];
  netWorth: number;
  investmentValue: number;
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#6366F1'];

const formatCurrency = (value: number) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}Jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-xl">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-budgify-400">
          Rp {new Intl.NumberFormat('id-ID').format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const OverviewCharts = ({ transactions, netWorth, investmentValue }: OverviewChartsProps) => {
  // Calculate expense breakdown by category (current month)
  const expensesByCategory = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const currentMonthExpenses = transactions.filter(t => {
      const date = new Date(t.date);
      return t.transaction_type === 'expense' && 
        isWithinInterval(date, { start: currentMonthStart, end: currentMonthEnd });
    });

    const categoryTotals = currentMonthExpenses.reduce((acc, t) => {
      const category = t.category;
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryLabels: Record<string, string> = {
      food: 'Makanan',
      transport: 'Transportasi',
      shopping: 'Belanja',
      bills: 'Tagihan',
      entertainment: 'Hiburan',
      health: 'Kesehatan',
      clothing: 'Pakaian',
      other: 'Lainnya'
    };

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name: categoryLabels[name] || name,
        value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Calculate net worth trend (last 6 months)
  const netWorthTrend = useMemo(() => {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Calculate cumulative balance up to this month
      const balance = transactions
        .filter(t => new Date(t.date) <= monthEnd)
        .reduce((sum, t) => {
          return t.transaction_type === 'income' ? sum + t.amount : sum - t.amount;
        }, 0);

      months.push({
        name: format(monthDate, 'MMM', { locale: id }),
        value: Math.max(0, balance)
      });
    }

    return months;
  }, [transactions]);

  // Calculate investment performance (simplified - last 6 months projection)
  const investmentPerformance = useMemo(() => {
    const now = new Date();
    const months = [];
    
    // Simulate historical growth (simplified)
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const growthFactor = 1 - (i * 0.03); // Assume 3% monthly growth
      months.push({
        name: format(monthDate, 'MMM', { locale: id }),
        value: Math.max(0, investmentValue * growthFactor)
      });
    }

    return months;
  }, [investmentValue]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="space-y-4"
    >
      {/* Expense Breakdown Pie Chart */}
      <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-5">
        <h3 className="text-sm font-semibold mb-3">Pengeluaran Bulan Ini</h3>
        {expensesByCategory.length > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-28 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {expensesByCategory.slice(0, 4).map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white/70 flex-1 truncate">{item.name}</span>
                  <span className="text-white/90 tabular-nums">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-white/50 text-sm">
            Belum ada data pengeluaran
          </div>
        )}
      </Card>

      {/* Net Worth Trend */}
      <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-5">
        <h3 className="text-sm font-semibold mb-3">Tren Kekayaan Bersih</h3>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthTrend}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Investment Performance */}
      <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-5">
        <h3 className="text-sm font-semibold mb-3">Performa Investasi</h3>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={investmentPerformance}>
              <defs>
                <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
};

export default OverviewCharts;
