import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { 
  Target, 
  Plus, 
  Plane, 
  Home, 
  GraduationCap, 
  Car, 
  Briefcase,
  PiggyBank,
  Heart,
  Sparkles,
  Trash2,
  Calendar
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

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: string;
  priority: string;
  status: string;
}

const goalIcons: Record<string, { icon: React.ElementType; color: string }> = {
  vacation: { icon: Plane, color: 'hsl(200, 98%, 39%)' },
  home: { icon: Home, color: 'hsl(142, 76%, 36%)' },
  education: { icon: GraduationCap, color: 'hsl(262, 83%, 58%)' },
  car: { icon: Car, color: 'hsl(38, 92%, 50%)' },
  business: { icon: Briefcase, color: 'hsl(var(--primary))' },
  emergency: { icon: PiggyBank, color: 'hsl(0, 84%, 60%)' },
  wedding: { icon: Heart, color: 'hsl(330, 81%, 60%)' },
  savings: { icon: PiggyBank, color: 'hsl(142, 76%, 36%)' },
  other: { icon: Sparkles, color: 'hsl(45, 93%, 47%)' },
};

const GoalsTracker = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributionDialog, setContributionDialog] = useState<string | null>(null);
  const [contribution, setContribution] = useState('');
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    deadline: '',
    category: 'savings',
    priority: 'medium'
  });

  useEffect(() => {
    fetchGoals();
    
    const channel = supabase
      .channel('goals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_goals' }, () => {
        fetchGoals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({ title: 'Error', description: 'Gagal memuat data goals', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => formatRupiah(value);

  const calculateDaysRemaining = (deadline: string | null) => {
    if (!deadline) return 0;
    const now = new Date();
    const target = new Date(deadline);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.target) {
      toast({ title: 'Error', description: 'Silakan lengkapi nama dan target', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('financial_goals').insert({
        user_id: user.id,
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target),
        current_amount: 0,
        deadline: newGoal.deadline || null,
        category: newGoal.category,
        priority: newGoal.priority,
        status: 'active'
      });

      if (error) throw error;

      toast({ title: 'Berhasil', description: 'Goal baru berhasil ditambahkan' });
      setDialogOpen(false);
      setNewGoal({ name: '', target: '', deadline: '', category: 'savings', priority: 'medium' });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan goal', variant: 'destructive' });
    }
  };

  const handleContribution = async (goalId: string) => {
    const amount = parseFloat(contribution);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Masukkan jumlah yang valid', variant: 'destructive' });
      return;
    }

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = Math.min(goal.current_amount + amount, goal.target_amount);
      const newStatus = newAmount >= goal.target_amount ? 'completed' : 'active';

      const { error } = await supabase
        .from('financial_goals')
        .update({ current_amount: newAmount, status: newStatus })
        .eq('id', goalId);

      if (error) throw error;

      toast({ title: 'Berhasil', description: `${formatCurrency(amount)} ditambahkan ke goal` });
      setContributionDialog(null);
      setContribution('');
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan dana', variant: 'destructive' });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from('financial_goals').delete().eq('id', goalId);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Goal berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({ title: 'Error', description: 'Gagal menghapus goal', variant: 'destructive' });
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const completedGoals = goals.filter(g => g.current_amount >= g.target_amount).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground mt-1">Atur dan lacak target keuangan Anda</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          Tambah Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Target className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Target</p>
                  <p className="text-xl font-bold">{formatCurrency(totalTarget)}</p>
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
                  <PiggyBank className="text-green-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Terkumpul</p>
                  <p className="text-xl font-bold">{formatCurrency(totalSaved)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-500/20">
                  <Sparkles className="text-yellow-500" size={24} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal Tercapai</p>
                  <p className="text-xl font-bold">{completedGoals}/{goals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, index) => {
          const iconData = goalIcons[goal.category] || goalIcons.other;
          const Icon = iconData.icon;
          const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
          const daysRemaining = calculateDaysRemaining(goal.deadline);
          const isCompleted = goal.current_amount >= goal.target_amount;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className={`bg-card/50 backdrop-blur-sm ${isCompleted ? 'border-green-500/50' : 'border-white/10'} hover:border-primary/30 transition-all`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: iconData.color + '20' }}>
                        <Icon size={20} style={{ color: iconData.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar size={12} />
                          {goal.deadline ? `${daysRemaining} hari lagi` : 'Tanpa batas waktu'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteGoal(goal.id)}>
                      <Trash2 size={16} className="text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className={isCompleted ? 'text-green-500 font-semibold' : ''}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={percentage} className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : ''}`} />
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Terkumpul</p>
                        <p className="font-semibold">{formatCurrency(goal.current_amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-semibold">{formatCurrency(goal.target_amount)}</p>
                      </div>
                    </div>

                    {!isCompleted && (
                      <Button variant="outline" className="w-full" onClick={() => setContributionDialog(goal.id)}>
                        <Plus size={16} className="mr-2" />
                        Tambah Dana
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="text-center py-2 bg-green-500/10 rounded-lg">
                        <span className="text-green-500 font-semibold">🎉 Goal Tercapai!</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="py-12 text-center">
            <Target className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-semibold mb-2">Belum ada goal</h3>
            <p className="text-muted-foreground mb-4">Mulai dengan menambahkan target keuangan pertama Anda</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={16} className="mr-2" />
              Tambah Goal
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Goal Baru</DialogTitle>
            <DialogDescription>Buat target keuangan baru untuk dicapai</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Goal</label>
              <Input
                value={newGoal.name}
                onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="contoh: Liburan ke Bali"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kategori</label>
              <Select value={newGoal.category} onValueChange={(v) => setNewGoal(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(goalIcons).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      <span className="capitalize">{cat}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target (IDR)</label>
              <Input
                type="number"
                value={newGoal.target}
                onChange={(e) => setNewGoal(prev => ({ ...prev, target: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Deadline (opsional)</label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddGoal}>Tambah Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contributionDialog} onOpenChange={() => setContributionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Dana</DialogTitle>
            <DialogDescription>Masukkan jumlah yang ingin ditambahkan</DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Jumlah (IDR)</label>
            <Input
              type="number"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionDialog(null)}>Batal</Button>
            <Button onClick={() => contributionDialog && handleContribution(contributionDialog)}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default GoalsTracker;
