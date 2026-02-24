import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  Plus, 
  Calendar,
  CreditCard,
  Wifi,
  Smartphone,
  Tv,
  Dumbbell,
  Music,
  CloudRain,
  Shield,
  Trash2,
  AlertCircle
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

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  transaction_type: string;
  category: string;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
}

const recurringIcons: Record<string, { icon: React.ElementType; color: string }> = {
  subscription: { icon: Tv, color: 'hsl(262, 83%, 58%)' },
  internet: { icon: Wifi, color: 'hsl(200, 98%, 39%)' },
  phone: { icon: Smartphone, color: 'hsl(var(--primary))' },
  gym: { icon: Dumbbell, color: 'hsl(0, 84%, 60%)' },
  music: { icon: Music, color: 'hsl(142, 76%, 36%)' },
  insurance: { icon: Shield, color: 'hsl(45, 93%, 47%)' },
  utilities: { icon: CloudRain, color: 'hsl(200, 70%, 50%)' },
  credit: { icon: CreditCard, color: 'hsl(38, 92%, 50%)' },
};

const RecurringManager = () => {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    amount: '',
    transaction_type: 'expense',
    frequency: 'monthly',
    category: 'subscription',
    nextDue: ''
  });

  useEffect(() => {
    fetchRecurring();
    
    const channel = supabase
      .channel('recurring-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions' }, () => {
        fetchRecurring();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRecurring = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching recurring:', error);
      toast({ title: 'Error', description: 'Gagal memuat data recurring', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => formatRupiah(value);

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' };
    return labels[freq] || freq;
  };

  const calculateDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error toggling active:', error);
      toast({ title: 'Error', description: 'Gagal mengubah status', variant: 'destructive' });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.amount || !newItem.nextDue) {
      toast({ title: 'Error', description: 'Silakan lengkapi semua field', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        name: newItem.name,
        amount: parseFloat(newItem.amount),
        transaction_type: newItem.transaction_type,
        category: newItem.category,
        frequency: newItem.frequency,
        next_due_date: newItem.nextDue,
        is_active: true
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Item berulang berhasil ditambahkan' });
      setDialogOpen(false);
      setNewItem({ name: '', amount: '', transaction_type: 'expense', frequency: 'monthly', category: 'subscription', nextDue: '' });
    } catch (error) {
      console.error('Error adding recurring:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan item', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Item berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting recurring:', error);
      toast({ title: 'Error', description: 'Gagal menghapus item', variant: 'destructive' });
    }
  };

  const activeItems = items.filter(i => i.is_active);
  const monthlyTotal = activeItems.filter(i => i.frequency === 'monthly').reduce((sum, i) => sum + i.amount, 0);
  const upcomingItems = activeItems.filter(i => {
    const days = calculateDaysUntilDue(i.next_due_date);
    return days <= 7 && days >= 0;
  }).sort((a, b) => calculateDaysUntilDue(a.next_due_date) - calculateDaysUntilDue(b.next_due_date));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Recurring</h1>
          <p className="text-muted-foreground mt-1">Kelola tagihan dan subscription berulang</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          Tambah Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <RefreshCw className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pengeluaran Bulanan</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Calendar className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Item Aktif</p>
                  <p className="text-xl font-bold">{activeItems.length} item</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className={`bg-card/50 backdrop-blur-sm ${upcomingItems.length > 0 ? 'border-yellow-500/50' : 'border-white/10'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <AlertCircle className="text-yellow-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jatuh Tempo Minggu Ini</p>
                  <p className="text-xl font-bold">{upcomingItems.length} item</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {upcomingItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="text-yellow-500" size={20} />
                Segera Jatuh Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingItems.map(item => {
                  const iconData = recurringIcons[item.category] || recurringIcons.subscription;
                  const Icon = iconData.icon;
                  const daysUntil = calculateDaysUntilDue(item.next_due_date);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-3">
                        <Icon size={20} style={{ color: iconData.color }} />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {daysUntil === 0 ? 'Hari ini' : `${daysUntil} hari lagi`}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Semua Item Berulang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map(item => {
                const iconData = recurringIcons[item.category] || recurringIcons.subscription;
                const Icon = iconData.icon;
                const daysUntil = calculateDaysUntilDue(item.next_due_date);

                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${item.is_active ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/[0.02] opacity-60'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: iconData.color + '20' }}>
                        <Icon size={20} style={{ color: iconData.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          <Badge variant="outline" className="text-xs">{getFrequencyLabel(item.frequency)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Jatuh tempo: {new Date(item.next_due_date).toLocaleDateString('id-ID')}
                          {daysUntil >= 0 && ` (${daysUntil} hari)`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-right">{formatCurrency(item.amount)}</p>
                      <Switch checked={item.is_active} onCheckedChange={() => handleToggleActive(item.id, item.is_active)} />
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 size={16} className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="text-center py-12">
                  <RefreshCw className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-semibold mb-2">Belum ada item berulang</h3>
                  <p className="text-muted-foreground mb-4">Tambahkan tagihan atau subscription berulang</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    Tambah Item
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Berulang</DialogTitle>
            <DialogDescription>Tambah tagihan atau subscription baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="contoh: Netflix"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Select value={newItem.category} onValueChange={(v) => setNewItem(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(recurringIcons).map(cat => (
                    <SelectItem key={cat} value={cat}><span className="capitalize">{cat}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah (IDR)</label>
              <Input
                type="number"
                value={newItem.amount}
                onChange={(e) => setNewItem(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frekuensi</label>
              <Select value={newItem.frequency} onValueChange={(v) => setNewItem(prev => ({ ...prev, frequency: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Harian</SelectItem>
                  <SelectItem value="weekly">Mingguan</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tanggal Jatuh Tempo Berikutnya</label>
              <Input
                type="date"
                value={newItem.nextDue}
                onChange={(e) => setNewItem(prev => ({ ...prev, nextDue: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddItem}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default RecurringManager;
