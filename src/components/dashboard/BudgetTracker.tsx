import React, { useState, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from "@/components/ui/separator";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, 
  PlusIcon, SearchIcon, SlashIcon, LineChartIcon, CheckIcon,
  BanknoteIcon, ShoppingCartIcon, HomeIcon, CarIcon,
  ShirtIcon, UtensilsIcon, HeartIcon, PartyPopperIcon,
  PiggyBankIcon, StarIcon, Trash2, UploadIcon, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

// Define transaction type
type TransactionType = 'income' | 'expense';

// Define a transaction interface
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  time?: string;
  transaction_type: TransactionType;
}

const BudgetTracker = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spentAmount, setSpentAmount] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Receipt analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [receiptConfirmOpen, setReceiptConfirmOpen] = useState(false);
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [analyzedData, setAnalyzedData] = useState<any>(null);
  const [editableReceiptData, setEditableReceiptData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'expense' as TransactionType
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) throw error;
      
      // Map database fields to Transaction interface
      const mappedData: Transaction[] = (data || []).map(item => ({
        id: item.id,
        description: item.description,
        amount: Number(item.amount),
        category: item.category,
        date: item.date,
        time: item.time || '12:00:00',
        transaction_type: item.transaction_type as TransactionType
      }));
      
      setTransactions(mappedData);
      
      // Calculate spent amount and income from transactions
      const expenses = (data || [])
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      setSpentAmount(expenses);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat transaksi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new transaction
  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) {
      toast({
        title: 'Error',
        description: 'Silakan isi semua field yang diperlukan',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Silakan masukkan jumlah yang valid',
        variant: 'destructive'
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmAddTransaction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Anda harus login terlebih dahulu',
          variant: 'destructive'
        });
        return;
      }

      const now = new Date();
      const { error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: user.id,
          description: newTransaction.description,
          amount: parseFloat(newTransaction.amount),
          category: newTransaction.category,
          transaction_type: newTransaction.type,
          date: now.toISOString().split('T')[0],
          time: now.toTimeString().split(' ')[0]
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil ditambahkan'
      });

      // Reset form
      setNewTransaction({
        description: '',
        amount: '',
        category: '',
        type: 'expense'
      });

      // Refresh transactions
      fetchTransactions();
      setConfirmDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan transaksi',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', transactionToDelete);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil dihapus'
      });

      fetchTransactions();
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive'
      });
    }
  };

  // Handle receipt upload and preview
  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Receipt file selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Silakan upload file gambar (JPG, PNG, dll)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file terlalu besar (maksimal 10MB)',
        variant: 'destructive'
      });
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
    setPreviewImageOpen(true);
  };

  // Analyze receipt after user confirms preview
  const analyzeReceipt = async () => {
    if (!fileInputRef.current?.files?.[0]) return;
    
    const file = fileInputRef.current.files[0];
    setPreviewImageOpen(false);
    setIsAnalyzing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string;
          console.log('Image converted to base64, size:', base64Image.length);
          
          // Call edge function to analyze receipt
          console.log('Calling analyze-receipt edge function...');
          const { data, error } = await supabase.functions.invoke('analyze-receipt', {
            body: { imageBase64: base64Image }
          });

          console.log('Edge function response:', { data, error });

          if (error) {
            console.error('Edge function error:', error);
            throw error;
          }

          if (!data || !data.success || !data.data) {
            console.error('Invalid response structure:', data);
            throw new Error('Gagal menganalisa receipt - response tidak valid');
          }

          console.log('Receipt analyzed successfully:', data.data);

          // Validate analyzed data
          const now = new Date();
          const validatedData = {
            merchant: data.data.merchant || 'Unknown Merchant',
            description: data.data.description || 'Receipt Purchase',
            amount: data.data.amount || 0,
            category: data.data.category || 'shopping',
            date: data.data.date || now.toISOString().split('T')[0],
            time: data.data.time || now.toTimeString().split(' ')[0],
            confidence: data.data.confidence || 'medium'
          };

          // Store analyzed data
          setAnalyzedData(validatedData);
          setEditableReceiptData({ ...validatedData });
          
          toast({
            title: 'Berhasil',
            description: `Receipt berhasil dianalisa dari ${validatedData.merchant}`,
          });
          
          // Show confidence warning if low
          if (validatedData.confidence === 'low') {
            toast({
              title: 'Perhatian',
              description: 'Receipt sulit dibaca. Mohon periksa dan edit data jika diperlukan.',
            });
          }

          // Validate if amount seems reasonable
          if (validatedData.amount <= 0 || validatedData.amount > 100000000) {
            toast({
              title: 'Peringatan',
              description: 'Jumlah transaksi tidak wajar. Mohon periksa kembali data.',
              variant: 'default'
            });
          }

          // Open confirmation dialog
          console.log('Opening confirmation dialog...');
          setReceiptConfirmOpen(true);
          
          // Clean up preview URL
          if (previewImageUrl) {
            URL.revokeObjectURL(previewImageUrl);
            setPreviewImageUrl(null);
          }
          
        } catch (analyzeError) {
          console.error('Error analyzing receipt:', analyzeError);
          toast({
            title: 'Error',
            description: analyzeError instanceof Error ? analyzeError.message : 'Gagal menganalisa receipt. Silakan coba lagi.',
            variant: 'destructive'
          });
        } finally {
          setIsAnalyzing(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setIsAnalyzing(false);
        console.error('FileReader error');
        toast({
          title: 'Error',
          description: 'Gagal membaca file',
          variant: 'destructive'
        });
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      setIsAnalyzing(false);
      console.error('Error uploading receipt:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengupload receipt',
        variant: 'destructive'
      });
    }
  };

  const confirmReceiptData = async () => {
    if (!editableReceiptData) {
      console.error('No receipt data available');
      toast({
        title: 'Error',
        description: 'Data receipt tidak tersedia',
        variant: 'destructive'
      });
      return;
    }

    // Validate edited data
    if (!editableReceiptData.description || !editableReceiptData.amount || !editableReceiptData.category) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua field yang diperlukan',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(editableReceiptData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah transaksi harus lebih dari 0',
        variant: 'destructive'
      });
      return;
    }

    console.log('Confirming receipt data:', editableReceiptData);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'Anda harus login terlebih dahulu',
          variant: 'destructive'
        });
        return;
      }

      console.log('Inserting transaction for user:', user.id);

      const transactionData = {
        user_id: user.id,
        description: editableReceiptData.description,
        amount: amount,
        category: editableReceiptData.category,
        transaction_type: 'expense',
        date: editableReceiptData.date,
        time: editableReceiptData.time || '12:00:00'
      };

      console.log('Transaction data to insert:', transactionData);

      const { error } = await supabase.from('budget_transactions').insert(transactionData);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Transaction inserted successfully');

      toast({
        title: 'Berhasil',
        description: 'Transaksi dari receipt berhasil ditambahkan'
      });

      setReceiptConfirmOpen(false);
      setAnalyzedData(null);
      setEditableReceiptData(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error confirming receipt data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menambahkan transaksi',
        variant: 'destructive'
      });
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const expensesByCategory = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieChartData = Object.keys(expensesByCategory).map(category => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: expensesByCategory[category]
  }));

  // Calculate monthly budget from income transactions
  const monthlyBudget = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((total, t) => total + t.amount, 0);

  // Bar chart data - monthly spending
  const barChartData = [
    { month: 'Jan', amount: 1700 },
    { month: 'Feb', amount: 1850 },
    { month: 'Mar', amount: 2100 },
    { month: 'Apr', amount: 1950 },
    { month: 'May', amount: 2200 },
    { month: 'Jun', amount: 2050 },
    { month: 'Jul', amount: 1842.65 }
  ];

  // Colors for pie chart
  const COLORS = ['#22c55e', '#0ea5e9', '#f97316', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f59e0b'];

  // Category options based on type
  const getCategoryOptions = (type: TransactionType) => {
    if (type === 'income') {
      return [
        { value: 'salary', label: 'Gaji' },
        { value: 'business', label: 'Bisnis' },
        { value: 'investment', label: 'Investasi' },
        { value: 'freelance', label: 'Freelance' },
        { value: 'other_income', label: 'Lainnya' }
      ];
    } else {
      return [
        { value: 'food', label: 'Makanan & Minuman' },
        { value: 'transportation', label: 'Transportasi' },
        { value: 'housing', label: 'Perumahan' },
        { value: 'utilities', label: 'Utilitas' },
        { value: 'entertainment', label: 'Hiburan' },
        { value: 'shopping', label: 'Belanja' },
        { value: 'health', label: 'Kesehatan' },
        { value: 'education', label: 'Pendidikan' },
        { value: 'other_expense', label: 'Lainnya' }
      ];
    }
  };

  // Category icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'housing':
        return <HomeIcon size={16} />;
      case 'food':
        return <UtensilsIcon size={16} />;
      case 'transportation':
        return <CarIcon size={16} />;
      case 'utilities':
        return <HomeIcon size={16} />;
      case 'shopping':
        return <ShoppingCartIcon size={16} />;
      case 'entertainment':
        return <PartyPopperIcon size={16} />;
      case 'health':
        return <HeartIcon size={16} />;
      case 'salary':
      case 'business':
      case 'investment':
      case 'freelance':
      case 'other_income':
        return <BanknoteIcon size={16} />;
      default:
        return <StarIcon size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Budget Overview Card */}
          <Card className="col-span-1 glass-card">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-3">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="rounded-xl p-3">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pie Chart Card */}
          <Card className="col-span-1 md:col-span-2 glass-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Skeleton className="h-72 w-72 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <Card className="glass-card">
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Overview Card */}
        <Card className="col-span-1 bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Budget</CardTitle>
            <CardDescription>Your spending overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-muted-foreground">Spent</p>
                <p className="text-2xl font-bold">{formatRupiah(spentAmount)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="text-xl">{formatRupiah(monthlyBudget)}</p>
              </div>
            </div>
  
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>
                  {((spentAmount / monthlyBudget) * 100).toFixed(0)}% used
                </span>
                <span>
                  Rp {formatRupiah(monthlyBudget - spentAmount, false)} remaining
                </span>
              </div>
              <Progress
                value={(spentAmount / monthlyBudget) * 100}
                className="h-2 bg-muted"
              />
            </div>
  
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-budgify-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Income</p>
                <p className="text-lg font-medium">
                  {formatRupiah(
                    transactions
                      .filter(t => t.transaction_type === 'income')
                      .reduce((total, t) => total + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="bg-red-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Expenses</p>
                <p className="text-lg font-medium">
                  {formatRupiah(
                    transactions
                      .filter(t => t.transaction_type === 'expense')
                      .reduce((total, t) => total + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
  
        {/* Expense by Category Card */}
        <Card className="col-span-1 md:col-span-2 bg-background/40 backdrop-blur-sm border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
            <CardDescription>Current month spending breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => [formatRupiah(value), 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Add new transaction section */}
      <Card className="bg-background/40 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Add New Transaction</CardTitle>
          <CardDescription>Record your income or expenses manually or scan a receipt</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Receipt Upload Area */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
              disabled={isAnalyzing}
            />
            <div
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
                "hover:border-budgify-500/50 hover:bg-budgify-500/5",
                "border-white/20 bg-background/20",
                isAnalyzing && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-10 w-10 text-budgify-500 animate-spin" />
                    <div>
                      <h3 className="font-semibold text-base">Analyzing Receipt...</h3>
                      <p className="text-sm text-muted-foreground">Please wait while we extract transaction data</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-budgify-500/20">
                      <UploadIcon className="h-7 w-7 text-budgify-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Upload Receipt</h3>
                      <p className="text-sm text-muted-foreground">Click to scan and analyze your receipt automatically</p>
                    </div>
                  </>
                )}
              </div>
              {!isAnalyzing && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  ⚠️ Receipt scanner hanya untuk analisa pengeluaran (expense)
                </p>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR ENTER MANUALLY
              </span>
            </div>
          </div>

          {/* Manual Entry Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs text-muted-foreground block mb-2">Deskripsi</label>
              <Input
                placeholder="Deskripsi transaksi"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                className="bg-card border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Jumlah</label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                className="bg-card border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Tipe</label>
              <Select
                value={newTransaction.type}
                onValueChange={(value: TransactionType) => setNewTransaction({...newTransaction, type: value, category: ''})}
              >
                <SelectTrigger className="w-full bg-card border-white/10">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Kategori</label>
              <Select
                value={newTransaction.category}
                onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
              >
                <SelectTrigger className="w-full bg-card border-white/10">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {getCategoryOptions(newTransaction.type).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="w-full mt-4 bg-budgify-500 hover:bg-budgify-600"
            onClick={handleAddTransaction}
          >
            <PlusIcon size={16} className="mr-2" />
            Tambah Transaksi
          </Button>
        </CardContent>
      </Card>
  
      {/* Recent transactions */}
      <Card className="bg-background/40 backdrop-blur-sm border-white/10">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Your financial activity</CardDescription>
            </div>
  
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-card border-white/10"
                />
              </div>
  
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px] bg-card border-white/10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
  
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] bg-card border-white/10">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
  
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-white/10">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground">DATE</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground">DESCRIPTION</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground">CATEGORY</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-right">AMOUNT</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="text-sm">{transaction.date}</div>
                        {transaction.time && (
                          <div className="text-xs text-muted-foreground">{transaction.time?.slice(0, 5)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <span>{transaction.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10">
                          {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                        </div>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-medium",
                        transaction.transaction_type === 'income' ? "text-budgify-500" : "text-red-500"
                      )}>
                        {transaction.transaction_type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTransactionToDelete(transaction.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No transactions found. Try adjusting your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
  
        <CardFooter className="flex justify-center py-4">
          <Button variant="outline" className="text-xs flex items-center gap-1 bg-card/40 border-white/10">
            View All Transactions <ChevronDownIcon size={14} />
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menambahkan transaksi ini?
              <div className="mt-4 space-y-2">
                <p><strong>Deskripsi:</strong> {newTransaction.description}</p>
                <p><strong>Jumlah:</strong> {formatRupiah(parseFloat(newTransaction.amount || '0'))}</p>
                <p><strong>Tipe:</strong> {newTransaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</p>
                <p><strong>Kategori:</strong> {getCategoryOptions(newTransaction.type).find(opt => opt.value === newTransaction.category)?.label}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddTransaction}>Konfirmasi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Dialog */}
      <AlertDialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Preview Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan gambar receipt Anda jelas dan dapat terbaca sebelum dianalisa
            </AlertDialogDescription>
          </AlertDialogHeader>
          {previewImageUrl && (
            <div className="my-4 flex justify-center">
              <img 
                src={previewImageUrl} 
                alt="Receipt preview" 
                className="max-h-96 rounded-lg border border-white/20"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (previewImageUrl) {
                URL.revokeObjectURL(previewImageUrl);
                setPreviewImageUrl(null);
              }
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={analyzeReceipt}>Analisa Receipt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Confirmation Dialog with Editable Fields */}
      <AlertDialog open={receiptConfirmOpen} onOpenChange={(open) => {
        setReceiptConfirmOpen(open);
        if (!open) {
          setAnalyzedData(null);
          setEditableReceiptData(null);
        }
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi & Edit Data Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Periksa dan edit data jika diperlukan sebelum menyimpan ke transaksi
            </AlertDialogDescription>
          </AlertDialogHeader>
          {editableReceiptData && (
            <div className="space-y-4 py-4">
              {analyzedData?.confidence === 'low' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Akurasi rendah - Mohon periksa dan edit data dengan teliti
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Merchant</label>
                <Input
                  value={editableReceiptData.merchant}
                  onChange={(e) => setEditableReceiptData({...editableReceiptData, merchant: e.target.value})}
                  placeholder="Nama merchant"
                  className="bg-card border-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Deskripsi *</label>
                <Input
                  value={editableReceiptData.description}
                  onChange={(e) => setEditableReceiptData({...editableReceiptData, description: e.target.value})}
                  placeholder="Deskripsi transaksi"
                  className="bg-card border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Jumlah *</label>
                  <Input
                    type="number"
                    value={editableReceiptData.amount}
                    onChange={(e) => setEditableReceiptData({...editableReceiptData, amount: e.target.value})}
                    placeholder="0.00"
                    className="bg-card border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Kategori *</label>
                  <Select
                    value={editableReceiptData.category}
                    onValueChange={(value) => setEditableReceiptData({...editableReceiptData, category: value})}
                  >
                    <SelectTrigger className="bg-card border-white/10">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCategoryOptions('expense').map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                  <Input
                    type="date"
                    value={editableReceiptData.date}
                    onChange={(e) => setEditableReceiptData({...editableReceiptData, date: e.target.value})}
                    className="bg-card border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Waktu</label>
                  <Input
                    type="time"
                    value={editableReceiptData.time?.slice(0, 5) || '12:00'}
                    onChange={(e) => setEditableReceiptData({...editableReceiptData, time: e.target.value + ':00'})}
                    className="bg-card border-white/10"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Transaksi ini akan disimpan sebagai <strong>Pengeluaran (Expense)</strong>
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setAnalyzedData(null);
              setEditableReceiptData(null);
            }}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReceiptData}>Simpan Transaksi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetTracker;
