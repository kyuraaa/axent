import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Bitcoin,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Holding {
  id: string;
  type: 'stock' | 'crypto';
  name: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

const HoldingsOverview = () => {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [exchangeRate, setExchangeRate] = useState(15700);

  useEffect(() => {
    fetchHoldings();
  }, []);

  const fetchHoldings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [investmentsRes, cryptoRes, exchangeRes] = await Promise.all([
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
        supabase.functions.invoke('exchange-rate')
      ]);

      const rate = exchangeRes.data?.rate || 15700;
      setExchangeRate(rate);

      // Fetch real-time prices
      const investments = investmentsRes.data || [];
      const cryptoHoldings = cryptoRes.data || [];

      const stockSymbols = investments.filter(i => i.type === 'stock').map(i => i.name);
      const cryptoSymbols = cryptoHoldings.map(c => c.symbol);

      let stockPrices: Record<string, number> = {};
      let cryptoPrices: Record<string, number> = {};

      if (stockSymbols.length > 0) {
        try {
          const { data } = await supabase.functions.invoke('stock-prices', { body: { symbols: stockSymbols } });
          stockPrices = data?.prices || {};
        } catch {}
      }

      if (cryptoSymbols.length > 0) {
        try {
          const { data } = await supabase.functions.invoke('crypto-prices', { body: { symbols: cryptoSymbols } });
          cryptoPrices = data?.prices || {};
        } catch {}
      }

      // Build holdings list
      const holdingsList: Holding[] = [];

      investments.filter(i => i.type === 'stock').forEach(inv => {
        const currentPrice = stockPrices[inv.name] || inv.current_value / (inv.amount || 1);
        const totalValue = inv.amount * currentPrice;
        const gainLoss = totalValue - inv.amount * (inv.amount > 0 ? inv.current_value / inv.amount : 0);
        
        holdingsList.push({
          id: inv.id,
          type: 'stock',
          name: inv.name,
          symbol: inv.name,
          quantity: inv.amount,
          avgPrice: inv.current_value / (inv.amount || 1),
          currentPrice,
          totalValue,
          gainLoss,
          gainLossPercent: inv.amount > 0 ? (gainLoss / (inv.amount * (inv.current_value / inv.amount))) * 100 : 0,
        });
      });

      cryptoHoldings.forEach(c => {
        const currentPriceUSD = cryptoPrices[c.symbol] || c.purchase_price;
        const currentPrice = currentPriceUSD * rate;
        const totalValue = c.amount * currentPrice;
        const costBasis = c.amount * c.purchase_price * rate;
        const gainLoss = totalValue - costBasis;

        holdingsList.push({
          id: c.id,
          type: 'crypto',
          name: c.coin_name,
          symbol: c.symbol,
          quantity: c.amount,
          avgPrice: c.purchase_price * rate,
          currentPrice,
          totalValue,
          gainLoss,
          gainLossPercent: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
        });
      });

      setHoldings(holdingsList);
    } catch (error) {
      console.error('Error fetching holdings:', error);
      toast({ title: 'Error', description: 'Gagal memuat data holdings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalGainLoss = holdings.reduce((sum, h) => sum + h.gainLoss, 0);
  const stocksValue = holdings.filter(h => h.type === 'stock').reduce((sum, h) => sum + h.totalValue, 0);
  const cryptoValue = holdings.filter(h => h.type === 'crypto').reduce((sum, h) => sum + h.totalValue, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Holdings</h1>
        <p className="text-muted-foreground mt-1">Detail kepemilikan aset investasi Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Wallet className="text-primary mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Total Nilai</p>
              <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`bg-card/50 backdrop-blur-sm ${totalGainLoss >= 0 ? 'border-green-500/30' : 'border-white/10'}`}>
            <CardContent className="pt-6">
              {totalGainLoss >= 0 ? <TrendingUp className="text-green-500 mb-2" size={24} /> : <TrendingDown className="text-white/70 mb-2" size={24} />}
              <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
              <p className={`text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-500' : 'text-white/70'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Building2 className="text-emerald-500 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Stocks</p>
              <p className="text-xl font-bold">{formatCurrency(stocksValue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <Bitcoin className="text-green-400 mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Crypto</p>
              <p className="text-xl font-bold">{formatCurrency(cryptoValue)}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Holdings Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Semua Holdings</CardTitle>
            <CardDescription>{holdings.length} aset</CardDescription>
          </CardHeader>
          <CardContent>
            {holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aset</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Harga Avg</TableHead>
                      <TableHead className="text-right">Harga Sekarang</TableHead>
                      <TableHead className="text-right">Nilai Total</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map(holding => (
                      <TableRow key={holding.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {holding.type === 'crypto' ? (
                              <Bitcoin className="text-green-400" size={20} />
                            ) : (
                              <Building2 className="text-emerald-500" size={20} />
                            )}
                            <div>
                              <p className="font-medium">{holding.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{holding.symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  {holding.type === 'crypto' ? 'Crypto' : 'Stock'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {holding.type === 'crypto' ? holding.quantity.toFixed(4) : holding.quantity}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(holding.avgPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(holding.currentPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(holding.totalValue)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${holding.gainLoss >= 0 ? 'text-green-500' : 'text-white/70'}`}>
                            {holding.gainLoss >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span className="font-medium">{formatCurrency(Math.abs(holding.gainLoss))}</span>
                            <span className="text-xs">({holding.gainLossPercent.toFixed(1)}%)</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">Belum ada holdings</h3>
                <p className="text-muted-foreground">Mulai investasi untuk melihat holdings Anda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default HoldingsOverview;