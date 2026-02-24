import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const InvestmentReports = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [reportData, setReportData] = useState({
    totalValue: 0,
    totalGain: 0,
    topPerformers: [] as { name: string; gain: number }[],
    worstPerformers: [] as { name: string; loss: number }[],
  });

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [investmentsRes, cryptoRes] = await Promise.all([
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('crypto_holdings').select('*').eq('user_id', user.id),
      ]);

      const investments = investmentsRes.data || [];
      const cryptoHoldings = cryptoRes.data || [];

      const totalValue = investments.reduce((sum, i) => sum + i.current_value, 0) +
        cryptoHoldings.reduce((sum, c) => sum + (c.amount * c.purchase_price * 15700), 0);

      // Simulated performance data
      const simulatedGain = totalValue * (period === 'year' ? 0.15 : period === 'quarter' ? 0.05 : 0.02);

      setReportData({
        totalValue,
        totalGain: simulatedGain,
        topPerformers: [
          { name: 'BBCA.JK', gain: 25.5 },
          { name: 'BTC', gain: 18.3 },
          { name: 'TLKM.JK', gain: 12.1 },
        ],
        worstPerformers: [
          { name: 'ETH', loss: -8.2 },
          { name: 'UNVR.JK', loss: -5.1 },
        ],
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({ title: 'Error', description: 'Gagal memuat laporan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const handleExport = () => {
    toast({ title: 'Export Started', description: 'Laporan sedang diproses...' });
    // Simulate export
    setTimeout(() => {
      toast({ title: 'Berhasil', description: 'Laporan berhasil diunduh' });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Investment Reports</h1>
          <p className="text-muted-foreground mt-1">Laporan lengkap performa investasi</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="quarter">Kuartal Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} className="gap-2">
            <Download size={16} />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <PieChart className="text-primary mb-2" size={24} />
              <p className="text-sm text-muted-foreground">Nilai Portfolio</p>
              <p className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={`bg-card/50 backdrop-blur-sm ${reportData.totalGain >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <CardContent className="pt-6">
              {reportData.totalGain >= 0 ? <TrendingUp className="text-green-500 mb-2" size={24} /> : <TrendingDown className="text-red-500 mb-2" size={24} />}
              <p className="text-sm text-muted-foreground">Gain/Loss Periode Ini</p>
              <p className={`text-2xl font-bold ${reportData.totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {reportData.totalGain >= 0 ? '+' : ''}{formatCurrency(reportData.totalGain)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.topPerformers.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-500">#{index + 1}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500">
                      +{item.gain}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="text-red-500" size={20} />
                Underperformers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.worstPerformers.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">#{index + 1}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge className="bg-red-500/20 text-red-500">
                      {item.loss}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Report Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Unduh Laporan</CardTitle>
            <CardDescription>Pilih format laporan yang diinginkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button variant="outline" className="gap-2 h-auto py-4 flex-col">
                <FileText size={24} />
                <span>Laporan PDF</span>
              </Button>
              <Button variant="outline" className="gap-2 h-auto py-4 flex-col">
                <FileText size={24} />
                <span>Spreadsheet Excel</span>
              </Button>
              <Button variant="outline" className="gap-2 h-auto py-4 flex-col">
                <FileText size={24} />
                <span>Laporan Pajak</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default InvestmentReports;
