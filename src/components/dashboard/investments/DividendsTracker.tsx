import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  DollarSign, 
  Plus, 
  Building2,
  Bitcoin,
  Trash2
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from '@/components/ui/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Dividend {
  id: string;
  stock_name: string;
  amount: number;
  dividend_date: string;
  dividend_per_share: number | null;
  shares_held: number | null;
  investment_id: string | null;
}

const DividendsTracker = () => {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDividend, setNewDividend] = useState({
    stock_name: '',
    amount: '',
    dividend_date: '',
    type: 'stock'
  });

  useEffect(() => {
    fetchDividends();
    
    const channel = supabase
      .channel('dividends-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dividends' }, () => {
        fetchDividends();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDividends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('dividends')
        .select('*')
        .eq('user_id', user.id)
        .order('dividend_date', { ascending: false });

      if (error) throw error;
      setDividends(data || []);
    } catch (error) {
      console.error('Error fetching dividends:', error);
      toast({ title: 'Error', description: 'Gagal memuat data dividen', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);
  const stockDividends = dividends.filter(d => d.stock_name.includes('.JK')).reduce((sum, d) => sum + d.amount, 0);
  const cryptoStaking = dividends.filter(d => !d.stock_name.includes('.JK')).reduce((sum, d) => sum + d.amount, 0);

  const monthlyData = dividends.reduce((acc, d) => {
    const month = new Date(d.dividend_date).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));

  const handleAddDividend = async () => {
    if (!newDividend.stock_name || !newDividend.amount || !newDividend.dividend_date) {
      toast({ title: 'Error', description: 'Silakan lengkapi semua field', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('dividends').insert({
        user_id: user.id,
        stock_name: newDividend.stock_name,
        amount: parseFloat(newDividend.amount),
        dividend_date: newDividend.dividend_date,
        dividend_per_share: null,
        shares_held: null,
        investment_id: null
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Dividen berhasil ditambahkan' });
      setDialogOpen(false);
      setNewDividend({ stock_name: '', amount: '', dividend_date: '', type: 'stock' });
    } catch (error) {
      console.error('Error adding dividend:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan dividen', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('dividends').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Dividen berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting dividend:', error);
      toast({ title: 'Error', description: 'Gagal menghapus dividen', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dividends</h1>
          <p className="text-muted-foreground mt-1">Track dividen dan passive income Anda</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          Tambah Dividen
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
            <CardContent className="pt-6">
              <DollarSign className="text-green-500 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Total Dividen</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totalDividends)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Building2 className="text-emerald-500 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Dari Saham</p>
              <p className="text-xl font-bold">{formatCurrency(stockDividends)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Bitcoin className="text-green-400 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Staking Rewards</p>
              <p className="text-xl font-bold">{formatCurrency(cryptoStaking)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader><CardTitle className="text-lg">Dividen per Bulan</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="amount" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Belum ada data dividen</div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader><CardTitle className="text-lg">Riwayat Dividen</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aset</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividends.map(dividend => (
                    <TableRow key={dividend.id}>
                      <TableCell className="font-medium">{dividend.stock_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {dividend.stock_name.includes('.JK') ? 'Saham' : 'Crypto'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(dividend.dividend_date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right font-semibold text-green-500">+{formatCurrency(dividend.amount)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(dividend.id)}>
                          <Trash2 size={16} className="text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {dividends.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-semibold mb-2">Belum ada dividen</h3>
                  <p className="text-muted-foreground mb-4">Catat dividen atau staking reward Anda</p>
                  <Button onClick={() => setDialogOpen(true)}><Plus size={16} className="mr-2" />Tambah Dividen</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Dividen</DialogTitle>
            <DialogDescription>Catat dividen atau staking reward baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Aset</label>
              <Input
                value={newDividend.stock_name}
                onChange={(e) => setNewDividend(prev => ({ ...prev, stock_name: e.target.value }))}
                placeholder="contoh: BBCA.JK atau BTC"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah (IDR)</label>
              <Input
                type="number"
                value={newDividend.amount}
                onChange={(e) => setNewDividend(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tanggal</label>
              <Input
                type="date"
                value={newDividend.dividend_date}
                onChange={(e) => setNewDividend(prev => ({ ...prev, dividend_date: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddDividend}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default DividendsTracker;