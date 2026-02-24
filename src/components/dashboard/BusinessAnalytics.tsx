import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, Users, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const BusinessAnalytics = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_finances')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenue = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const profit = revenue - expenses;

  const categoryData = transactions.reduce((acc: any, t) => {
    const key = t.category;
    if (!acc[key]) {
      acc[key] = { category: key, amount: 0 };
    }
    acc[key].amount += t.amount;
    return acc;
  }, {});

  const chartData = Object.values(categoryData);

  const COLORS = ['#22c55e', '#06b6d4', '#a855f7', '#f59e0b', '#ef4444', '#8b5cf6'];

  const stats = [
    {
      title: 'Total Revenue',
      value: `Rp ${revenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      change: '+12.5%',
      positive: true,
    },
    {
      title: 'Total Expenses',
      value: `Rp ${expenses.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      change: '-3.2%',
      positive: true,
    },
    {
      title: 'Net Profit',
      value: `Rp ${profit.toLocaleString('id-ID')}`,
      icon: ShoppingCart,
      change: '+18.3%',
      positive: profit >= 0,
    },
    {
      title: 'Transactions',
      value: transactions.length.toString(),
      icon: Users,
      change: '+5',
      positive: true,
    },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Business Analytics</h2>
        <p className="text-sm sm:text-base text-white/70">Track your business performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass p-4 sm:p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={24} className="text-budgify-400" />
              <span className={`text-xs font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mb-1">{stat.title}</p>
            <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Revenue', value: revenue },
              { name: 'Expenses', value: expenses },
              { name: 'Profit', value: profit },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass p-4 sm:p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.category}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass p-4 sm:p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Business</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-right py-3 px-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id} className="border-b border-white/5">
                  <td className="py-3 px-2">
                    {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-2">{transaction.business_name}</td>
                  <td className="py-3 px-2">{transaction.category}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.transaction_type === 'income' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    Rp {transaction.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
