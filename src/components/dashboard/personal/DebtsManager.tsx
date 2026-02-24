import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Plus, 
  Building2,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Calendar,
  DollarSign
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
import { toast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface Debt {
  id: string;
  name: string;
  creditor: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  minimum_payment: number;
  due_date: string | null;
  status: string;
}

const debtIcons: Record<string, { icon: React.ElementType; color: string }> = {
  credit_card: { icon: CreditCard, color: 'hsl(0, 84%, 60%)' },
  mortgage: { icon: Home, color: 'hsl(142, 76%, 36%)' },
  car_loan: { icon: Car, color: 'hsl(200, 98%, 39%)' },
  student_loan: { icon: GraduationCap, color: 'hsl(262, 83%, 58%)' },
  personal_loan: { icon: Briefcase, color: 'hsl(var(--primary))' },
  business_loan: { icon: Building2, color: 'hsl(45, 93%, 47%)' },
};

const COLORS = ['hsl(0, 84%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(200, 98%, 39%)', 'hsl(262, 83%, 58%)', 'hsl(var(--primary))', 'hsl(45, 93%, 47%)'];

const DebtsManager = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [newDebt, setNewDebt] = useState({
    name: '',
    creditor: '',
    type: 'credit_card',
    totalAmount: '',
    remainingAmount: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchDebts();
    
    const channel = supabase
      .channel('debts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => {
        fetchDebts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('remaining_amount', { ascending: false });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast({ title: 'Error', description: 'Gagal memuat data utang', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => formatRupiah(value);

  const getDebtTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_card: 'Kartu Kredit', mortgage: 'KPR', car_loan: 'Kredit Mobil',
      student_loan: 'Pinjaman Pendidikan', personal_loan: 'Pinjaman Pribadi', business_loan: 'Pinjaman Bisnis'
    };
    return labels[type] || type;
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.remaining_amount, 0);
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.minimum_payment, 0);
  const highestInterestDebt = debts.length > 0 ? debts.reduce((max, d) => (d.interest_rate || 0) > (max.interest_rate || 0) ? d : max, debts[0]) : null;

  const pieData = debts.map(d => ({ name: d.name, value: d.remaining_amount }));
  const barData = debts.map(d => ({
    name: d.name.substring(0, 15),
    remaining: d.remaining_amount,
    paid: d.total_amount - d.remaining_amount
  }));

  const handleAddDebt = async () => {
    if (!newDebt.name || !newDebt.creditor || !newDebt.totalAmount || !newDebt.remainingAmount) {
      toast({ title: 'Error', description: 'Silakan lengkapi field yang diperlukan', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('debts').insert({
        user_id: user.id,
        name: newDebt.name,
        creditor: newDebt.creditor,
        total_amount: parseFloat(newDebt.totalAmount),
        remaining_amount: parseFloat(newDebt.remainingAmount),
        interest_rate: parseFloat(newDebt.interestRate) || 0,
        minimum_payment: parseFloat(newDebt.minimumPayment) || 0,
        due_date: newDebt.dueDate || null,
        status: 'active'
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Utang berhasil ditambahkan' });
      setDialogOpen(false);
      setNewDebt({ name: '', creditor: '', type: 'credit_card', totalAmount: '', remainingAmount: '', interestRate: '', minimumPayment: '', dueDate: '' });
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan utang', variant: 'destructive' });
    }
  };

  const handlePayment = async (debtId: string) => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Masukkan jumlah yang valid', variant: 'destructive' });
      return;
    }

    try {
      const debt = debts.find(d => d.id === debtId);
      if (!debt) return;

      const newRemaining = Math.max(0, debt.remaining_amount - amount);
      const newStatus = newRemaining === 0 ? 'paid' : 'active';

      const { error } = await supabase
        .from('debts')
        .update({ remaining_amount: newRemaining, status: newStatus })
        .eq('id', debtId);

      if (error) throw error;

      toast({ title: 'Berhasil', description: `Pembayaran ${formatCurrency(amount)} berhasil dicatat` });
      setPaymentDialog(null);
      setPaymentAmount('');
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({ title: 'Error', description: 'Gagal mencatat pembayaran', variant: 'destructive' });
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      const { error } = await supabase.from('debts').delete().eq('id', debtId);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Utang berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast({ title: 'Error', description: 'Gagal menghapus utang', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Debts</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau utang Anda</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          Tambah Utang
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/20">
                  <TrendingDown className="text-red-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Utang</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(totalDebt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Calendar className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cicilan Bulanan</p>
                  <p className="text-xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <AlertTriangle className="text-yellow-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bunga Tertinggi</p>
                  <p className="text-xl font-bold">{highestInterestDebt?.interest_rate || 0}%</p>
                  <p className="text-xs text-muted-foreground">{highestInterestDebt?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader><CardTitle className="text-lg">Distribusi Utang</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Belum ada data utang</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader><CardTitle className="text-lg">Progress Pembayaran</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical">
                    <XAxis type="number" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                    <YAxis type="category" dataKey="name" fontSize={10} width={80} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="paid" stackId="a" fill="hsl(142, 76%, 36%)" name="Terbayar" />
                    <Bar dataKey="remaining" stackId="a" fill="hsl(0, 84%, 60%)" name="Sisa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader><CardTitle className="text-lg">Daftar Utang</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debts.map(debt => {
                const iconData = debtIcons[debt.creditor] || debtIcons.personal_loan;
                const Icon = iconData.icon;
                const paidPercentage = debt.total_amount > 0 ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100 : 0;

                return (
                  <div key={debt.id} className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: iconData.color + '20' }}>
                          <Icon size={20} style={{ color: iconData.color }} />
                        </div>
                        <div>
                          <p className="font-medium">{debt.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{debt.creditor}</Badge>
                            <span className="text-xs text-muted-foreground">Bunga: {debt.interest_rate}%/bulan</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPaymentDialog(debt.id)}>
                          <DollarSign size={14} className="mr-1" />Bayar
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debt.id)}>
                          <Trash2 size={16} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{paidPercentage.toFixed(0)}% terbayar</span>
                      </div>
                      <Progress value={paidPercentage} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-muted-foreground">Sisa</p>
                          <p className="font-semibold text-red-500">{formatCurrency(debt.remaining_amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Total Awal</p>
                          <p className="font-semibold">{formatCurrency(debt.total_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {debts.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-semibold mb-2">Tidak ada utang</h3>
                  <p className="text-muted-foreground mb-4">Anda bebas utang! 🎉</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Utang Baru</DialogTitle>
            <DialogDescription>Catat utang baru untuk dikelola</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input value={newDebt.name} onChange={(e) => setNewDebt(prev => ({ ...prev, name: e.target.value }))} placeholder="contoh: Kartu Kredit BCA" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Kreditor</label>
              <Input value={newDebt.creditor} onChange={(e) => setNewDebt(prev => ({ ...prev, creditor: e.target.value }))} placeholder="contoh: Bank BCA" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Total Utang (IDR)</label>
              <Input type="number" value={newDebt.totalAmount} onChange={(e) => setNewDebt(prev => ({ ...prev, totalAmount: e.target.value }))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Sisa Utang (IDR)</label>
              <Input type="number" value={newDebt.remainingAmount} onChange={(e) => setNewDebt(prev => ({ ...prev, remainingAmount: e.target.value }))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Bunga (%/bulan)</label>
              <Input type="number" value={newDebt.interestRate} onChange={(e) => setNewDebt(prev => ({ ...prev, interestRate: e.target.value }))} placeholder="0" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Cicilan Minimum (IDR)</label>
              <Input type="number" value={newDebt.minimumPayment} onChange={(e) => setNewDebt(prev => ({ ...prev, minimumPayment: e.target.value }))} placeholder="0" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddDebt}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>Masukkan jumlah pembayaran</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Jumlah (IDR)</label>
            <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0" className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>Batal</Button>
            <Button onClick={() => paymentDialog && handlePayment(paymentDialog)}>Bayar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default DebtsManager;
