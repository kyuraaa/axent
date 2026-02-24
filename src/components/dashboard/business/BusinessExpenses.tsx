import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calculator, Plus, Briefcase, Car, Users, Laptop, Building, Coffee, Megaphone, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const expenseCategories = [
  { id: 'operasional', name: 'Operasional', icon: Building, color: '#3b82f6' },
  { id: 'gaji', name: 'Gaji Karyawan', icon: Users, color: '#22c55e' },
  { id: 'marketing', name: 'Marketing', icon: Megaphone, color: '#f59e0b' },
  { id: 'teknologi', name: 'Teknologi', icon: Laptop, color: '#8b5cf6' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#ec4899' },
  { id: 'utilities', name: 'Utilities', icon: Coffee, color: '#14b8a6' },
  { id: 'maintenance', name: 'Maintenance', icon: Wrench, color: '#f97316' },
  { id: 'lainnya', name: 'Lainnya', icon: Briefcase, color: '#6b7280' }
];

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

const BusinessExpenses = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('business_finances')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .order('transaction_date', { ascending: false });

      if (data) {
        setExpenses(data.map(d => ({
          id: d.id,
          category: d.category,
          amount: d.amount,
          description: d.description || '',
          date: d.transaction_date
        })));
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('business_finances').insert({
        user_id: user.id,
        business_name: 'Default Business',
        transaction_type: 'expense',
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        transaction_date: newExpense.date
      });

      toast({
        title: 'Berhasil',
        description: 'Pengeluaran berhasil ditambahkan'
      });

      setIsDialogOpen(false);
      setNewExpense({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan pengeluaran',
        variant: 'destructive'
      });
    }
  };

  // Calculate category totals for pie chart
  const categoryTotals = expenseCategories.map(cat => ({
    name: cat.name,
    value: expenses.filter(e => e.category.toLowerCase() === cat.id).reduce((sum, e) => sum + e.amount, 0),
    color: cat.color
  })).filter(c => c.value > 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Business Expenses</h1>
            <p className="text-muted-foreground">Kategorisasi biaya operasional dan track pengeluaran bisnis</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran Bisnis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Kategori</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Deskripsi pengeluaran"
                />
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleAddExpense}>
                Simpan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Total Pengeluaran</CardTitle>
            <CardDescription>Semua pengeluaran bisnis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-500">
              Rp {totalExpenses.toLocaleString('id-ID')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              dari {expenses.length} transaksi
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Distribusi per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Belum ada data pengeluaran
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {expenseCategories.map(cat => {
          const total = expenses.filter(e => e.category.toLowerCase() === cat.id).reduce((sum, e) => sum + e.amount, 0);
          const Icon = cat.icon;
          
          return (
            <Card key={cat.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <p className="text-lg font-bold">Rp {total.toLocaleString('id-ID')}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Expenses */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Pengeluaran Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengeluaran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.slice(0, 10).map(expense => {
                const category = expenseCategories.find(c => c.id === expense.category.toLowerCase());
                const Icon = category?.icon || Briefcase;
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/10">
                        <Icon className="w-4 h-4" style={{ color: category?.color }} />
                      </div>
                      <div>
                        <p className="font-medium">{expense.description || expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.date}</p>
                      </div>
                    </div>
                    <p className="font-bold text-red-500">
                      -Rp {expense.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessExpenses;
