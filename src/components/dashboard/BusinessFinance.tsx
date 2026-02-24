import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Calculator, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { businessFinanceSchema } from '@/lib/validation';
import { z } from 'zod';
import { formatRupiah } from '@/lib/utils';
import HppCalculator from './business-finance/HppCalculator';
import BusinessForecaster from './business-finance/BusinessForecaster';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  created_at: string;
}

const BusinessFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    description: '',
    amount: '',
    transaction_type: 'income',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
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
      toast({
        title: 'Error',
        description: 'Gagal memuat data transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const validationData = {
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        transaction_type: formData.transaction_type as 'income' | 'expense',
        transaction_date: formData.transaction_date,
      };

      businessFinanceSchema.parse(validationData);
      setValidationErrors({});

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Anda harus login terlebih dahulu',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('business_finances').insert({
        user_id: user.id,
        business_name: validationData.business_name.trim(),
        category: validationData.category.trim(),
        description: validationData.description || null,
        amount: validationData.amount,
        transaction_type: validationData.transaction_type,
        transaction_date: validationData.transaction_date,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil ditambahkan',
      });

      setIsDialogOpen(false);
      setFormData({
        business_name: '',
        category: '',
        description: '',
        amount: '',
        transaction_type: 'income',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchTransactions();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: 'Validasi Gagal',
          description: 'Mohon periksa kembali input Anda',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menambahkan transaksi',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_finances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus',
      });
      fetchTransactions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
      });
    }
  };

  const calculateTotals = () => {
    const income = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return { income, expenses, profit: income - expenses };
  };

  const { income, expenses, profit } = calculateTotals();

  // Tax Planning Calculations
  const taxRate = 0.25; // 25% for demo
  const estimatedTax = profit > 0 ? profit * taxRate : 0;
  const netProfit = profit - estimatedTax;

  // Tax deductions by category
  const getTaxDeductions = () => {
    const deductibleCategories = ['Operasional', 'Gaji', 'Marketing', 'Sewa', 'Utilitas'];
    return transactions
      .filter(t => t.transaction_type === 'expense' && deductibleCategories.some(cat => 
        t.category.toLowerCase().includes(cat.toLowerCase())
      ))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const taxDeductions = getTaxDeductions();
  const taxableIncome = Math.max(0, profit - taxDeductions);
  const optimizedTax = taxableIncome * taxRate;
  const taxSavings = estimatedTax - optimizedTax;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards - Match actual 4-column layout */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-32 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-32" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section - Match actual tabbed layout */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-10 w-44 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-card/40 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-36 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Akuntansi Bisnis</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="business_name">Nama Bisnis</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="transaction_type">Tipe Transaksi</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Contoh: Penjualan, Gaji, Operasional"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="transaction_date">Tanggal</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Simpan Transaksi
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatRupiah(income)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatRupiah(expenses)}
            </div>
          </CardContent>
        </Card>

        <Card className={`glass-card ${profit >= 0 ? 'border-primary/20' : 'border-destructive/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <DollarSign className={`h-4 w-4 ${profit >= 0 ? 'text-primary' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
               {formatRupiah(profit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Planning Section */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            Perencanaan Pajak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Ringkasan Pajak</TabsTrigger>
              <TabsTrigger value="deductions">Potongan Pajak</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Laba Kotor</span>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">
                    {formatRupiah(profit)}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Estimasi Pajak (25%)</span>
                    <Calculator className="h-4 w-4 text-destructive" />
                  </div>
                  <p className="text-2xl font-bold text-destructive">
                    {formatRupiah(estimatedTax)}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-background/40 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Laba Setelah Pajak</span>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(netProfit)}
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Potensi Penghematan</span>
                    <TrendingDown className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatRupiah(taxSavings)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dengan optimasi potongan pajak
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Catatan Perencanaan Pajak
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tarif pajak saat ini: 25%</li>
                  <li>• Total potongan yang memenuhi syarat: {formatRupiah(taxDeductions)}</li>
                  <li>• Penghasilan kena pajak: {formatRupiah(taxableIncome)}</li>
                  <li>• Pajak yang dioptimalkan: {formatRupiah(optimizedTax)}</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="deductions" className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-background/40 border border-border">
                <h4 className="font-semibold mb-3">Kategori yang Dapat Dikurangkan</h4>
                <div className="space-y-3">
                  {['Operasional', 'Gaji', 'Marketing', 'Sewa', 'Utilitas'].map(category => {
                    const categoryTotal = transactions
                      .filter(t => t.transaction_type === 'expense' && t.category.toLowerCase().includes(category.toLowerCase()))
                      .reduce((sum, t) => sum + Number(t.amount), 0);
                    
                    if (categoryTotal === 0) return null;
                    
                    return (
                      <div key={category} className="flex justify-between items-center p-3 rounded bg-background/60">
                        <span className="font-medium">{category}</span>
                        <span className="text-primary font-bold">
                          {formatRupiah(categoryTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="font-semibold">Total Potongan</span>
                  <span className="text-xl font-bold text-primary">
                    {formatRupiah(taxDeductions)}
                  </span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold mb-2">Tips Optimasi Pajak</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Pastikan semua biaya operasional dicatat dengan baik</li>
                  <li>• Pisahkan pengeluaran bisnis dan pribadi</li>
                  <li>• Simpan semua bukti transaksi dan invoice</li>
                  <li>• Konsultasi dengan konsultan pajak profesional</li>
                  <li>• Manfaatkan insentif pajak yang tersedia</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* HPP Calculator */}
      <HppCalculator />

      {/* Business Forecaster */}
      <BusinessForecaster />

      {/* Transactions List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada transaksi. Mulai dengan menambahkan transaksi pertama Anda.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-border hover:bg-background/60 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'income'
                          ? 'bg-primary/20'
                          : 'bg-destructive/20'
                      }`}>
                        {transaction.transaction_type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{transaction.business_name}</h4>
                        <p className="text-sm text-muted-foreground">{transaction.category}</p>
                      </div>
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground ml-11">{transaction.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground ml-11">
                      {format(new Date(transaction.transaction_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${
                      transaction.transaction_type === 'income' ? 'text-primary' : 'text-destructive'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {formatRupiah(Number(transaction.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(transaction.id)}
                      className="hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessFinance;
