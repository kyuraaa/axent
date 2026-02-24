import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Receipt, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/utils';

interface Transaction {
  id: string;
  business_name: string;
  transaction_type: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
}

const BusinessTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTransaction, setNewTransaction] = useState({
    business_name: '',
    transaction_type: 'income',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
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
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('business_finances').insert({
        user_id: user.id,
        business_name: newTransaction.business_name,
        transaction_type: newTransaction.transaction_type,
        category: newTransaction.category,
        amount: parseFloat(newTransaction.amount),
        description: newTransaction.description || null,
        transaction_date: newTransaction.transaction_date
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil ditambahkan'
      });

      setIsDialogOpen(false);
      setNewTransaction({
        business_name: '',
        transaction_type: 'income',
        category: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      });
      fetchTransactions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan transaksi',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('business_finances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus'
      });
      fetchTransactions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive'
      });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.business_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.transaction_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Business Transactions</h1>
            <p className="text-muted-foreground">Kelola semua transaksi bisnis termasuk pemasukan dan pengeluaran</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Bisnis</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nama Bisnis</Label>
                <Input
                  value={newTransaction.business_name}
                  onChange={(e) => setNewTransaction({ ...newTransaction, business_name: e.target.value })}
                  placeholder="Nama bisnis"
                />
              </div>
              <div>
                <Label>Tipe Transaksi</Label>
                <Select
                  value={newTransaction.transaction_type}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, transaction_type: value })}
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
                <Label>Kategori</Label>
                <Input
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  placeholder="Kategori"
                />
              </div>
              <div>
                <Label>Jumlah</Label>
                <Input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Input
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Deskripsi (opsional)"
                />
              </div>
              <div>
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleAddTransaction}>
                Simpan Transaksi
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatRupiah(totalIncome)}
                </p>
              </div>
              <ArrowUpRight className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatRupiah(totalExpense)}
                </p>
              </div>
              <ArrowDownRight className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit/Loss</p>
                <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatRupiah(totalIncome - totalExpense)}
                </p>
              </div>
              <Receipt className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
                <SelectItem value="expense">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>{filteredTransactions.length} transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada transaksi bisnis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.transaction_type === 'income' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {transaction.transaction_type === 'income' 
                        ? <ArrowUpRight className="w-5 h-5" />
                        : <ArrowDownRight className="w-5 h-5" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || transaction.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.business_name} • {transaction.transaction_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-bold ${
                      transaction.transaction_type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}
                      {formatRupiah(transaction.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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

export default BusinessTransactions;
