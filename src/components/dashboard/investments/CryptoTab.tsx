import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, Plus, Trash2, Upload } from 'lucide-react';
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
import { TickerSelect } from '../crypto/TickerSelect';

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

interface CryptoTabProps {
  loading: boolean;
  holdings: CryptoHolding[];
  onRefresh: () => void;
}

export const CryptoTab = ({ loading, holdings: initialHoldings, onRefresh }: CryptoTabProps) => {
  const [holdings, setHoldings] = useState<CryptoHolding[]>(initialHoldings);
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
  const [exchangeRate, setExchangeRate] = useState(15700);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scannedData, setScannedData] = useState({
    coin_name: '',
    symbol: '',
    coin_id: '',
    amount: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    coin_name: '',
    symbol: '',
    coin_id: '',
    amount: '',
    purchase_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    setHoldings(initialHoldings);
  }, [initialHoldings]);

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  useEffect(() => {
    if (holdings.length > 0 && exchangeRate) {
      fetchPrices();
      const interval = setInterval(fetchPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [holdings, exchangeRate]);

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
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
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
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menambahkan crypto',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!holdingToDelete) return;

    try {
      const { error } = await supabase
        .from('crypto_holdings')
        .delete()
        .eq('id', holdingToDelete);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Crypto berhasil dihapus',
      });
      setDeleteDialogOpen(false);
      setHoldingToDelete(null);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus crypto',
        variant: 'destructive',
      });
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data, error } = await supabase.functions.invoke('analyze-crypto-transaction', {
        body: formData
      });

      if (error) throw error;

      console.log('Scanned crypto data:', data);
      setScannedData({
        coin_id: data.coin_id || '',
        coin_name: data.coin_name || '',
        symbol: data.symbol || '',
        amount: data.amount?.toString() || '',
        purchase_price: data.purchase_price?.toString() || '',
        purchase_date: data.date || format(new Date(), 'yyyy-MM-dd')
      });
      setScanDialogOpen(true);

      toast({
        title: 'Berhasil',
        description: 'Screenshot berhasil dianalisis',
      });
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      toast({
        title: 'Error',
        description: 'Gagal menganalisis screenshot',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const confirmScannedData = async () => {
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

      const validationData = {
        coin_name: scannedData.coin_name,
        symbol: scannedData.symbol.toUpperCase(),
        coin_id: scannedData.coin_id.toLowerCase(),
        amount: parseFloat(scannedData.amount),
        purchase_price: parseFloat(scannedData.purchase_price),
        purchase_date: scannedData.purchase_date,
      };

      cryptoHoldingSchema.parse(validationData);

      const { error } = await supabase.from('crypto_holdings').insert({
        user_id: user.id,
        ...validationData,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Crypto berhasil ditambahkan dari screenshot',
      });

      setScannedData({
        coin_name: '',
        symbol: '',
        coin_id: '',
        amount: '',
        purchase_price: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setScanDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menambahkan crypto',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Crypto Portfolio</h2>
          <p className="text-sm text-muted-foreground">Real-time tracking with AI analysis</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" onClick={fetchCryptoList}>
                <Plus className="mr-2 h-4 w-4" />
                Add Crypto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Crypto Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Ticker Crypto</Label>
                  <TickerSelect
                    cryptoList={cryptoList}
                    value={formData.symbol}
                    onSelect={handleTickerSelect}
                    loadingList={loadingList}
                  />
                  {validationErrors.symbol && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.symbol}</p>
                  )}
                </div>
                <div>
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.5"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                  {validationErrors.amount && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.amount}</p>
                  )}
                </div>
                <div>
                  <Label>Harga Beli (Rp per coin)</Label>
                  <Input
                    type="number"
                    placeholder="2000000"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                  {validationErrors.purchase_price && (
                    <p className="text-sm text-destructive mt-1">{validationErrors.purchase_price}</p>
                  )}
                </div>
                <div>
                  <Label>Tanggal Pembelian</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Tambah</Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleScanClick}
            disabled={isAnalyzing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Scan Screenshot'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-3">
        {holdings.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">No crypto yet. Add your first crypto!</p>
          </div>
        ) : (
          holdings.map((holding) => {
            const currentPrice = prices[holding.symbol] || holding.purchase_price;
            const totalInvested = holding.purchase_price * holding.amount;
            const currentValue = currentPrice * holding.amount;
            const profitLoss = currentValue - totalInvested;
            const profitLossPercentage = (profitLoss / totalInvested) * 100;
            const isProfit = profitLoss >= 0;
            const logo = cryptoList.find(c => c.symbol === holding.symbol)?.logo;

            return (
              <div key={holding.id} className="glass-card p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {logo && (
                      <img src={logo} alt={holding.coin_name} className="h-10 w-10 rounded-full" onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }} />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{holding.coin_name}</h4>
                        {prices[holding.symbol] && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{holding.symbol}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {holding.amount} {holding.symbol} @ Rp {currentPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dibeli: {new Date(holding.purchase_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      Rp {currentValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-sm ${isProfit ? 'text-primary' : 'text-red-500'}`}>
                      {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>
                        Rp {Math.abs(profitLoss).toLocaleString('id-ID', { maximumFractionDigits: 0 })} ({profitLossPercentage.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChart(selectedChart === holding.symbol ? null : holding.symbol)}
                      >
                        Chart
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setHoldingToDelete(holding.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* TradingView Chart */}
                {selectedChart === holding.symbol && (
                  <div className="mt-4">
                    <iframe
                      src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=BINANCE:${holding.symbol}USDT&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Asia/Jakarta&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=id`}
                      className="w-full h-[400px] rounded-lg"
                      frameBorder="0"
                      allowTransparency={true}
                      scrolling="no"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penambahan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah data crypto sudah benar?
              <div className="mt-4 space-y-2 text-foreground">
                <p><strong>Crypto:</strong> {editableData?.coin_name} ({editableData?.symbol})</p>
                <p><strong>Jumlah:</strong> {editableData?.amount}</p>
                <p><strong>Harga Beli:</strong> Rp {parseFloat(editableData?.purchase_price || '0').toLocaleString('id-ID')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddCrypto}>Ya, Tambahkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Crypto</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus crypto ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Data Crypto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Coin ID</Label>
              <Input
                value={scannedData.coin_id}
                onChange={(e) => setScannedData({ ...scannedData, coin_id: e.target.value })}
                placeholder="bitcoin"
              />
            </div>
            <div>
              <Label>Nama Coin</Label>
              <Input
                value={scannedData.coin_name}
                onChange={(e) => setScannedData({ ...scannedData, coin_name: e.target.value })}
                placeholder="Bitcoin"
              />
            </div>
            <div>
              <Label>Symbol</Label>
              <Input
                value={scannedData.symbol}
                onChange={(e) => setScannedData({ ...scannedData, symbol: e.target.value.toUpperCase() })}
                placeholder="BTC"
              />
            </div>
            <div>
              <Label>Jumlah</Label>
              <Input
                type="number"
                step="any"
                value={scannedData.amount}
                onChange={(e) => setScannedData({ ...scannedData, amount: e.target.value })}
                placeholder="0.5"
              />
            </div>
            <div>
              <Label>Harga Beli per Coin (Rp)</Label>
              <Input
                type="number"
                value={scannedData.purchase_price}
                onChange={(e) => setScannedData({ ...scannedData, purchase_price: e.target.value })}
                placeholder="2000000"
              />
            </div>
            {scannedData.amount && scannedData.purchase_price && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Investasi</p>
                <p className="text-lg font-semibold">
                  Rp {(parseFloat(scannedData.amount) * parseFloat(scannedData.purchase_price)).toLocaleString('id-ID')}
                </p>
              </div>
            )}
            <div>
              <Label>Tanggal Pembelian</Label>
              <Input
                type="date"
                value={scannedData.purchase_date}
                onChange={(e) => setScannedData({ ...scannedData, purchase_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmScannedData}>
              Tambahkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
