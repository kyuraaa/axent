import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatRupiah } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { StockTickerSelect } from '../stocks/StockTickerSelect';

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
}

interface StocksTabProps {
  loading: boolean;
  investments: Investment[];
  onRefresh: () => void;
}

export const StocksTab = ({ loading, investments, onRefresh }: StocksTabProps) => {
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: '',
    pricePerShare: '',
    shares: '',
    purchase_date: new Date().toISOString().split('T')[0]
  });
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scannedData, setScannedData] = useState({
    ticker: '',
    name: '',
    shares: '',
    pricePerShare: '',
    date: new Date().toISOString().split('T')[0]
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (investments.length > 0) {
      fetchStockPrices();
      const interval = setInterval(fetchStockPrices, 60000);
      return () => clearInterval(interval);
    }
  }, [investments]);

  const fetchStockPrices = async () => {
    try {
      setFetchingPrices(true);
      const symbols = [...new Set(investments.map(inv => inv.type))];
      
      if (symbols.length === 0) return;

      const { data, error } = await supabase.functions.invoke('stock-prices', {
        body: { symbols }
      });

      if (error) throw error;

      if (data?.prices) {
        setStockPrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching stock prices:', error);
    } finally {
      setFetchingPrices(false);
    }
  };

  const handleTickerChange = (symbol: string, description: string) => {
    setNewInvestment({
      ...newInvestment,
      type: symbol,
      name: description
    });
  };

  const handleAddInvestment = () => {
    if (!newInvestment.name || !newInvestment.type || !newInvestment.pricePerShare || !newInvestment.shares) {
      toast({
        title: 'Error',
        description: 'Harap isi semua field yang diperlukan',
        variant: 'destructive'
      });
      return;
    }

    const pricePerShare = parseFloat(newInvestment.pricePerShare);
    const shares = parseFloat(newInvestment.shares);
    if (isNaN(pricePerShare) || pricePerShare <= 0 || isNaN(shares) || shares <= 0) {
      toast({
        title: 'Error',
        description: 'Harap masukkan jumlah yang valid',
        variant: 'destructive'
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmAddInvestment = async () => {
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

      const shares = parseFloat(newInvestment.shares);
      const pricePerShare = parseFloat(newInvestment.pricePerShare);
      const totalAmount = shares * 100 * pricePerShare;

      const { error } = await supabase.from('investments').insert({
        user_id: user.id,
        name: newInvestment.name,
        type: newInvestment.type,
        amount: totalAmount,
        current_value: totalAmount,
        purchase_date: newInvestment.purchase_date
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Saham berhasil ditambahkan',
      });

      setNewInvestment({
        name: '',
        type: '',
        pricePerShare: '',
        shares: '',
        purchase_date: new Date().toISOString().split('T')[0]
      });
      setConfirmDialogOpen(false);
      setInvestmentDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan saham',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvestment = (id: string) => {
    setInvestmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteInvestment = async () => {
    if (!investmentToDelete) return;

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentToDelete);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Saham berhasil dihapus',
      });

      setDeleteDialogOpen(false);
      setInvestmentToDelete(null);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus saham',
        variant: 'destructive'
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

      const { data, error } = await supabase.functions.invoke('analyze-stock-transaction', {
        body: formData
      });

      if (error) throw error;

      console.log('Scanned stock data:', data);
      setScannedData({
        ticker: data.ticker || '',
        name: data.name || '',
        shares: data.shares?.toString() || '',
        pricePerShare: data.pricePerShare?.toString() || '',
        date: data.date || new Date().toISOString().split('T')[0]
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

      const shares = parseFloat(scannedData.shares);
      const pricePerShare = parseFloat(scannedData.pricePerShare);
      const totalAmount = shares * 100 * pricePerShare;

      const { error } = await supabase.from('investments').insert({
        user_id: user.id,
        name: scannedData.name,
        type: scannedData.ticker,
        amount: totalAmount,
        current_value: totalAmount,
        purchase_date: scannedData.date
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Saham berhasil ditambahkan dari screenshot',
      });

      setScannedData({
        ticker: '',
        name: '',
        shares: '',
        pricePerShare: '',
        date: new Date().toISOString().split('T')[0]
      });
      setScanDialogOpen(false);
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menambahkan saham',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Stock Portfolio</h2>
          <p className="text-sm text-muted-foreground">Real-time tracking with AI analysis</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={investmentDialogOpen} onOpenChange={setInvestmentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Saham Baru</DialogTitle>
                <DialogDescription>
                  Pilih ticker untuk menambahkan saham Anda
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ticker</label>
                  <StockTickerSelect
                    value={newInvestment.type}
                    onValueChange={handleTickerChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nama Saham</label>
                  <Input
                    placeholder="Otomatis terisi setelah memilih ticker"
                    value={newInvestment.name}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Jumlah Saham (Lot)</label>
                  <Input
                    type="number"
                    placeholder="Contoh: 10"
                    value={newInvestment.shares}
                    onChange={(e) => setNewInvestment({ ...newInvestment, shares: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Harga Beli per Saham (Rp)</label>
                  <Input
                    type="number"
                    placeholder="8000"
                    value={newInvestment.pricePerShare}
                    onChange={(e) => setNewInvestment({ ...newInvestment, pricePerShare: e.target.value })}
                  />
                </div>
                {newInvestment.shares && newInvestment.pricePerShare && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Investasi</p>
                    <p className="text-lg font-semibold">
                      {formatRupiah(parseFloat(newInvestment.shares) * 100 * parseFloat(newInvestment.pricePerShare))}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium">Tanggal Pembelian</label>
                  <Input
                    type="date"
                    value={newInvestment.purchase_date}
                    onChange={(e) => setNewInvestment({ ...newInvestment, purchase_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddInvestment}>Tambah</Button>
              </DialogFooter>
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

      {/* Stock List */}
      <div className="space-y-3">
        {investments.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">No stocks yet. Add your first stock!</p>
          </div>
        ) : (
          <>
            {investments.map((investment) => {
              const currentPrice = stockPrices[investment.type];
              const shares = investment.amount / (investment.current_value / investment.amount);
              const displayValue = currentPrice 
                ? currentPrice * shares
                : investment.current_value;
              
              const gainLoss = displayValue - investment.amount;
              const gainLossPercentage = (gainLoss / investment.amount) * 100;
              const isProfit = gainLoss >= 0;

              return (
                <div key={investment.id} className="glass-card p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{investment.name}</h4>
                        {currentPrice && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{investment.type}</p>
                      {currentPrice && (
                        <p className="text-xs text-muted-foreground mt-1">
                          @ {formatRupiah(currentPrice)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Dibeli: {new Date(investment.purchase_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatRupiah(displayValue)}
                      </p>
                      <div className={`flex items-center justify-end gap-1 text-sm ${isProfit ? 'text-primary' : 'text-red-500'}`}>
                        {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>
                          {formatRupiah(Math.abs(gainLoss))} ({gainLossPercentage.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedChart(selectedChart === investment.type ? null : investment.type)}
                        >
                          Chart
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteInvestment(investment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* TradingView Chart */}
                  {selectedChart === investment.type && (
                    <div className="mt-4">
                      <iframe
                        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=IDX:${investment.type}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Asia/Jakarta&withdateranges=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=id`}
                        className="w-full h-[400px] rounded-lg"
                        frameBorder="0"
                        allowTransparency={true}
                        scrolling="no"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penambahan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah data saham sudah benar?
              <div className="mt-4 space-y-2 text-foreground">
                <p><strong>Nama:</strong> {newInvestment.name}</p>
                <p><strong>Ticker:</strong> {newInvestment.type}</p>
                <p><strong>Jumlah Saham:</strong> {newInvestment.shares} lot</p>
                <p><strong>Harga Beli:</strong> Rp {parseFloat(newInvestment.pricePerShare || '0').toLocaleString('id-ID')}</p>
                <p><strong>Total Investasi:</strong> Rp {(parseFloat(newInvestment.shares || '0') * 100 * parseFloat(newInvestment.pricePerShare || '0')).toLocaleString('id-ID')}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAddInvestment}>Ya, Tambahkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Saham</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus saham ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteInvestment} className="bg-destructive">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan Dialog */}
      <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Data Saham</DialogTitle>
            <DialogDescription>
              Periksa dan edit data hasil scan jika diperlukan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ticker</label>
              <Input
                value={scannedData.ticker}
                onChange={(e) => setScannedData({ ...scannedData, ticker: e.target.value })}
                placeholder="BBCA.JK"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nama Saham</label>
              <Input
                value={scannedData.name}
                onChange={(e) => setScannedData({ ...scannedData, name: e.target.value })}
                placeholder="PT Bank Central Asia Tbk"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah (Lot)</label>
              <Input
                type="number"
                value={scannedData.shares}
                onChange={(e) => setScannedData({ ...scannedData, shares: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Harga per Saham (Rp)</label>
              <Input
                type="number"
                value={scannedData.pricePerShare}
                onChange={(e) => setScannedData({ ...scannedData, pricePerShare: e.target.value })}
                placeholder="8000"
              />
            </div>
            {scannedData.shares && scannedData.pricePerShare && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Investasi</p>
                <p className="text-lg font-semibold">
                  Rp {(parseFloat(scannedData.shares) * 100 * parseFloat(scannedData.pricePerShare)).toLocaleString('id-ID')}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Tanggal Transaksi</label>
              <Input
                type="date"
                value={scannedData.date}
                onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScanDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmScannedData}>
              Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
