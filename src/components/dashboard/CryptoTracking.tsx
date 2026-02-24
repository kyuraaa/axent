import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatRupiah } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Plus, Trash2, Bitcoin, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { cryptoHoldingSchema } from '@/lib/validation';
import { z } from 'zod';
import { Skeleton } from '@/components/ui/skeleton';
import { TickerSelect } from './crypto/TickerSelect';

interface CryptoHolding {
  id: string;
  coin_id: string;
  coin_name: string;
  symbol: string;
  amount: number;
  purchase_price: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
  current_price?: number;
}

const CryptoTracking = () => {
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [holdingToDelete, setHoldingToDelete] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [previewImageOpen, setPreviewImageOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editableData, setEditableData] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [cryptoList, setCryptoList] = useState<Array<{ symbol: string; name: string; id: string; slug: string; logo?: string }>>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(15700); // Default fallback rate
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tradingViewRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    coin_name: '',
    symbol: '',
    coin_id: '',
    amount: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchCryptoList = async () => {
    try {
      setLoadingList(true);
      const { data, error } = await supabase.functions.invoke('crypto-list');
      
      if (error) throw error;
      
      if (data?.cryptoList) {
        setCryptoList(data.cryptoList);
      }
    } catch (error) {
      console.error('Error fetching crypto list:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat daftar cryptocurrency',
        variant: 'destructive',
      });
    } finally {
      setLoadingList(false);
    }
  };

  const handleTickerSelect = (symbol: string, name: string, slug: string) => {
    setFormData({
      ...formData,
      symbol,
      coin_name: name,
      coin_id: slug,
    });
  };

  const fetchExchangeRate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('exchange-rate');
      
      if (error) throw error;
      
      if (data?.rate) {
        setExchangeRate(data.rate);
        console.log('Exchange rate updated:', data.rate, 'Source:', data.source);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Keep using the fallback rate
    }
  };

  useEffect(() => {
    fetchHoldings();
    fetchExchangeRate();
    
    // Update exchange rate every hour
    const exchangeRateInterval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    
    return () => clearInterval(exchangeRateInterval);
  }, []);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [holdings, exchangeRate]); // Re-fetch when exchange rate changes

  useEffect(() => {
    // Load TradingView widgets for each holding
    holdings.forEach(holding => {
      const containerId = `tradingview_${holding.id}`;
      const container = tradingViewRefs.current[containerId];
      
      if (container && !container.querySelector('iframe')) {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (window.TradingView) {
            new window.TradingView.widget({
              autosize: true,
              symbol: `BINANCE:${holding.symbol}USDT`,
              interval: 'D',
              timezone: 'Asia/Jakarta',
              theme: 'dark',
              style: '1',
              locale: 'id',
              toolbar_bg: '#f1f3f6',
              enable_publishing: false,
              hide_top_toolbar: true,
              hide_legend: true,
              save_image: false,
              container_id: containerId,
            });
          }
        };
        document.head.appendChild(script);
      }
    });
  }, [holdings]);

  const fetchHoldings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crypto_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHoldings(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data crypto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const symbols = [...new Set(holdings.map(h => h.symbol))];
      if (symbols.length === 0) return;

      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.prices) {
        // Convert USD to IDR using real-time exchange rate
        const pricesInIDR: Record<string, number> = {};
        
        Object.keys(data.prices).forEach(symbol => {
          pricesInIDR[symbol] = data.prices[symbol] * exchangeRate;
        });
        
        setPrices(pricesInIDR);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File harus berupa gambar',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setPreviewImageUrl(imageUrl);
      setPreviewImageOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    setIsAnalyzing(true);
    setPreviewImageOpen(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-crypto-transaction', {
        body: { image: previewImageUrl }
      });

      if (error) throw error;

      if (data.confidence && data.confidence < 0.7) {
        toast({
          title: 'Peringatan',
          description: 'AI kurang yakin dengan hasil scan. Mohon periksa data dengan teliti.',
          variant: 'default',
        });
      }

      setEditableData({
        coin_name: data.coin_name || '',
        symbol: data.symbol?.toUpperCase() || '',
        coin_id: data.coin_id?.toLowerCase() || '',
        amount: data.amount?.toString() || '',
        purchase_price: data.purchase_price?.toString() || '',
        purchase_date: data.purchase_date || format(new Date(), 'yyyy-MM-dd'),
      });
      setConfirmDialogOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menganalisis gambar. Silakan coba lagi atau input manual.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validationData = {
        coin_name: formData.coin_name,
        symbol: formData.symbol.toUpperCase(),
        coin_id: formData.coin_id.toLowerCase(),
        amount: parseFloat(formData.amount),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
      };

      cryptoHoldingSchema.parse(validationData);
      setValidationErrors({});
      setEditableData(formData);
      setConfirmDialogOpen(true);
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
          description: 'Gagal menambahkan crypto',
          variant: 'destructive',
        });
      }
    }
  };

  const confirmAddCrypto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const validationData = {
        coin_name: editableData.coin_name,
        symbol: editableData.symbol.toUpperCase(),
        coin_id: editableData.coin_id.toLowerCase(),
        amount: parseFloat(editableData.amount),
        purchase_price: parseFloat(editableData.purchase_price),
        purchase_date: editableData.purchase_date,
      };

      cryptoHoldingSchema.parse(validationData);

      const { error } = await supabase.from('crypto_holdings').insert({
        user_id: user.id,
        ...validationData,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Crypto berhasil ditambahkan',
      });

      setConfirmDialogOpen(false);
      setIsDialogOpen(false);
      setEditableData(null);
      setFormData({
        coin_name: '',
        symbol: '',
        coin_id: '',
        amount: '',
        purchase_price: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchHoldings();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menambahkan crypto',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crypto_holdings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Crypto berhasil dihapus',
      });
      fetchHoldings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus crypto',
        variant: 'destructive',
      });
    }
  };

  const calculatePortfolio = () => {
    const totalInvested = holdings.reduce((sum, h) => sum + (Number(h.purchase_price) * Number(h.amount)), 0);
    const totalCurrent = holdings.reduce((sum, h) => {
      const currentPrice = prices[h.symbol] || Number(h.purchase_price);
      return sum + (currentPrice * Number(h.amount));
    }, 0);
    const profitLoss = totalCurrent - totalInvested;
    const profitLossPercentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return { totalInvested, totalCurrent, profitLoss, profitLossPercentage };
  };

  const { totalInvested, totalCurrent, profitLoss, profitLossPercentage } = calculatePortfolio();

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <Skeleton className="h-6 sm:h-8 w-40 sm:w-48" />
          <Skeleton className="h-9 sm:h-10 w-full sm:w-40 rounded-lg" />
        </div>

        {/* Stats Cards - Responsive */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <Skeleton className="h-3 sm:h-4 w-28 sm:w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 sm:h-9 w-32 sm:w-40 mb-2" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 rounded" />
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-28" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 sm:h-9 w-28 sm:w-36" />
            </CardContent>
          </Card>
          <Card className="glass-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 sm:h-9 w-32 sm:w-40" />
                <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table - Responsive Skeleton */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <Skeleton className="h-5 sm:h-6 w-32 sm:w-36" />
            <Skeleton className="h-9 sm:h-10 w-full sm:w-36 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-card/40 rounded-lg border border-white/5 gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 sm:h-5 w-24 sm:w-28 mb-2" />
                      <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                    <Skeleton className="h-4 sm:h-5 w-28 sm:w-32" />
                    <div className="flex items-center gap-2 sm:justify-end">
                      <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 rounded" />
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold">Crypto Tracking</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full sm:w-auto text-sm"
            disabled={isAnalyzing}
          >
            <Camera className="mr-2 h-4 w-4" />
            Scan Transaksi
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open && cryptoList.length === 0) {
              fetchCryptoList();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Manual
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Add Crypto Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (open && cryptoList.length === 0) {
          fetchCryptoList();
        }
      }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tambah Crypto Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="symbol">Ticker / Symbol</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Ketik nama atau symbol untuk mencari crypto
                </p>
                <TickerSelect
                  value={formData.symbol}
                  onSelect={handleTickerSelect}
                  cryptoList={cryptoList}
                  loadingList={loadingList}
                />
              </div>
              <div>
                <Label htmlFor="coin_name">Nama Coin</Label>
                <Input
                  id="coin_name"
                  value={formData.coin_name}
                  disabled
                  placeholder="Otomatis terisi setelah memilih ticker"
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="amount">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.00000001"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_price">Harga Beli (Rp per coin)</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_date">Tanggal Pembelian</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Simpan Crypto
              </Button>
            </form>
        </DialogContent>
      </Dialog>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Investasi</CardTitle>
            <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {formatRupiah(totalInvested)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Nilai Saat Ini</CardTitle>
            <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {formatRupiah(totalCurrent)}
            </div>
          </CardContent>
        </Card>

        <Card className={`glass-card ${profitLoss >= 0 ? 'border-primary/20' : 'border-destructive/20'} sm:col-span-2 lg:col-span-1`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Keuntungan/Kerugian</CardTitle>
            {profitLoss >= 0 ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-lg sm:text-2xl font-bold ${profitLoss >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {profitLoss >= 0 ? '+' : ''}{formatRupiah(profitLoss)}
            </div>
            <p className={`text-xs ${profitLoss >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {profitLoss >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Portfolio Crypto</CardTitle>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
              Belum ada crypto. Mulai dengan menambahkan crypto pertama Anda.
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {holdings.map((holding) => {
                const invested = Number(holding.purchase_price) * Number(holding.amount);
                const currentPrice = prices[holding.symbol] || Number(holding.purchase_price);
                const current = currentPrice * Number(holding.amount);
                const profit = current - invested;
                const profitPercent = (profit / invested) * 100;

                return (
                  <div key={holding.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background/40 border border-border hover:bg-background/60 transition-colors gap-3 sm:gap-0">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          {cryptoList.find(c => c.symbol === holding.symbol)?.logo ? (
                            <img 
                              src={cryptoList.find(c => c.symbol === holding.symbol)?.logo} 
                              alt={holding.symbol}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="p-1.5 sm:p-2 rounded-full bg-primary/20">
                              <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-sm sm:text-base">{holding.coin_name}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">{holding.symbol}</p>
                          </div>
                        </div>
                        <div className="ml-9 sm:ml-11 space-y-1">
                          <p className="text-xs sm:text-sm">
                            Jumlah: <span className="font-medium">{Number(holding.amount).toFixed(8)}</span>
                          </p>
                          <p className="text-xs sm:text-sm">
                            Harga Beli: <span className="font-medium">{formatRupiah(Number(holding.purchase_price))}</span>
                          </p>
                          <p className="text-xs sm:text-sm">
                            Harga Saat Ini: <span className="font-medium text-primary">{formatRupiah(currentPrice)}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(holding.purchase_date), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-left sm:text-right">
                          <div className="text-base sm:text-lg font-bold">
                            {formatRupiah(current)}
                          </div>
                          <div className={`text-xs sm:text-sm font-medium ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {profit >= 0 ? '+' : ''}{formatRupiah(profit)} ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%)
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setHoldingToDelete(holding.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* TradingView Chart */}
                    <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                      <div
                        id={`tradingview_${holding.id}`}
                        ref={(el) => tradingViewRefs.current[`tradingview_${holding.id}`] = el}
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Image Dialog */}
      <AlertDialog open={previewImageOpen} onOpenChange={setPreviewImageOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Preview Transaksi Crypto</AlertDialogTitle>
            <AlertDialogDescription>
              Periksa gambar transaksi sebelum dianalisa oleh AI
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <img src={previewImageUrl} alt="Preview" className="w-full" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={analyzeImage} disabled={isAnalyzing}>
              {isAnalyzing ? 'Menganalisa...' : 'Analisa dengan AI'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog with Editable Fields */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Data Crypto</AlertDialogTitle>
            <AlertDialogDescription>
              Periksa dan edit data jika diperlukan sebelum menyimpan
            </AlertDialogDescription>
          </AlertDialogHeader>
          {editableData && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_symbol">Ticker / Symbol</Label>
                <Input
                  id="edit_symbol"
                  value={editableData.symbol}
                  onChange={(e) => setEditableData({ ...editableData, symbol: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="edit_coin_name">Nama Coin</Label>
                <Input
                  id="edit_coin_name"
                  value={editableData.coin_name}
                  onChange={(e) => setEditableData({ ...editableData, coin_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_amount">Jumlah</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.00000001"
                  value={editableData.amount}
                  onChange={(e) => setEditableData({ ...editableData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_purchase_price">Harga Beli (Rp per coin)</Label>
                <Input
                  id="edit_purchase_price"
                  type="number"
                  step="0.01"
                  value={editableData.purchase_price}
                  onChange={(e) => setEditableData({ ...editableData, purchase_price: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_purchase_date">Tanggal Pembelian</Label>
                <Input
                  id="edit_purchase_date"
                  type="date"
                  value={editableData.purchase_date}
                  onChange={(e) => setEditableData({ ...editableData, purchase_date: e.target.value })}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEditableData(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddCrypto}>Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Crypto</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus crypto ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHoldingToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (holdingToDelete) {
                  handleDelete(holdingToDelete);
                  setDeleteDialogOpen(false);
                  setHoldingToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

declare global {
  interface Window {
    TradingView: any;
  }
}

export default CryptoTracking;
