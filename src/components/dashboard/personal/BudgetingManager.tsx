import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { 
  Plus, 
  Edit2, 
  Trash2,
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Smartphone,
  Heart,
  PartyPopper,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetCategory {
  id: string;
  category: string;
  budget: number;
  spent: number;
  icon: React.ElementType;
  color: string;
}

const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
  shopping: { icon: ShoppingCart, color: 'hsl(var(--primary))' },
  food: { icon: Utensils, color: 'hsl(45, 93%, 47%)' },
  transport: { icon: Car, color: 'hsl(200, 98%, 39%)' },
  housing: { icon: Home, color: 'hsl(142, 76%, 36%)' },
  utilities: { icon: Zap, color: 'hsl(38, 92%, 50%)' },
  phone: { icon: Smartphone, color: 'hsl(262, 83%, 58%)' },
  health: { icon: Heart, color: 'hsl(0, 84%, 60%)' },
  entertainment: { icon: PartyPopper, color: 'hsl(330, 81%, 60%)' },
};

const BudgetingManager = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [newBudget, setNewBudget] = useState({ category: '', budget: '' });

  // Default budgets - in real app, these would come from database
  const defaultBudgets: Record<string, number> = {
    shopping: 2000000,
    food: 3000000,
    transport: 1500000,
    housing: 5000000,
    utilities: 1000000,
    phone: 500000,
    health: 1000000,
    entertainment: 1500000,
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: transactions } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_type', 'expense')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      // Calculate spent per category
      const spentByCategory: Record<string, number> = {};
      (transactions || []).forEach(t => {
        spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount);
      });

      // Build category list
      const categoryList: BudgetCategory[] = Object.keys(categoryIcons).map(cat => ({
        id: cat,
        category: cat,
        budget: defaultBudgets[cat] || 1000000,
        spent: spentByCategory[cat] || 0,
        icon: categoryIcons[cat].icon,
        color: categoryIcons[cat].color,
      }));

      setCategories(categoryList);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast({ title: 'Error', description: 'Gagal memuat data budget', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const overBudgetCategories = categories.filter(c => c.spent > c.budget);

  const pieData = categories.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: c.budget,
    spent: c.spent,
  }));

  const barData = categories.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1).substring(0, 4),
    budget: c.budget,
    spent: c.spent,
  }));

  const handleSaveBudget = () => {
    const amount = parseFloat(newBudget.budget);
    if (!newBudget.category || isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Silakan isi data dengan benar', variant: 'destructive' });
      return;
    }

    setCategories(prev => prev.map(c => 
      c.category === newBudget.category ? { ...c, budget: amount } : c
    ));

    toast({ title: 'Berhasil', description: 'Budget berhasil diupdate' });
    setDialogOpen(false);
    setNewBudget({ category: '', budget: '' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Budgeting</h1>
          <p className="text-muted-foreground mt-1">Kelola budget per kategori</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Edit2 size={16} />
          Edit Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Terpakai</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalSpent)}</p>
              <Progress value={(totalSpent / totalBudget) * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`bg-card/50 backdrop-blur-sm ${overBudgetCategories.length > 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {overBudgetCategories.length > 0 ? (
                  <>
                    <AlertTriangle className="text-red-500" size={20} />
                    <span className="text-red-500 font-semibold">{overBudgetCategories.length} Over Budget</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="text-green-500" size={20} />
                    <span className="text-green-500 font-semibold">On Track</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Budget vs Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="name" fontSize={12} width={60} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="budget" fill="hsl(var(--muted-foreground) / 0.3)" name="Budget" />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" name="Terpakai" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Alokasi Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(categoryIcons)[index]?.color || 'hsl(var(--primary))'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Budget per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const percentage = (cat.spent / cat.budget) * 100;
                const isOverBudget = cat.spent > cat.budget;
                
                return (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-xl border ${isOverBudget ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: cat.color + '20' }}>
                        <Icon size={20} style={{ color: cat.color }} />
                      </div>
                      <span className="font-medium capitalize">{cat.category}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terpakai</span>
                        <span className={isOverBudget ? 'text-red-500' : ''}>{formatCurrency(cat.spent)}</span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage.toFixed(0)}%</span>
                        <span>dari {formatCurrency(cat.budget)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Atur budget untuk kategori tertentu</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Select value={newBudget.category} onValueChange={(v) => setNewBudget(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.category} value={c.category}>
                      <span className="capitalize">{c.category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Budget (IDR)</label>
              <Input
                type="number"
                value={newBudget.budget}
                onChange={(e) => setNewBudget(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveBudget}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default BudgetingManager;
