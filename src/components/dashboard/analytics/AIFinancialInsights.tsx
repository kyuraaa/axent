import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Sparkles, RefreshCw, TrendingUp, PiggyBank, AlertTriangle, Target } from 'lucide-react';

const AIFinancialInsights = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const generateInsights = async (uid: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('financial-advisor-chat', {
        body: {
          userId: uid,
          messages: [{
            role: 'user',
            content: `Berikan analisis komprehensif tentang kondisi keuangan saya secara keseluruhan, mencakup:
1. Ringkasan kesehatan keuangan (income vs expenses, savings rate)
2. Performa investasi saham dan crypto
3. Kondisi keuangan bisnis
4. 3-5 rekomendasi spesifik untuk meningkatkan kondisi keuangan

Gunakan data aktual saya dan berikan insight yang actionable dalam format poin-poin singkat.`
          }]
        }
      });

      if (error) throw error;
      if (data?.response) {
        setInsights(data.response as string);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghasilkan analisis AI',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
        await generateInsights(user.id);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    if (!userId) return;
    setRefreshing(true);
    await generateInsights(userId);
    setRefreshing(false);
    toast({
      title: 'Berhasil',
      description: 'Analisis AI telah diperbarui'
    });
  };

  if (loading) {
    return (
      <Card className="bg-background/40 backdrop-blur-sm border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const formatInsights = (text: string) => {
    // Split by newlines and filter empty lines
    const lines = text.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if it's a numbered point or bullet
      const isPoint = /^(\d+\.|[-•*])/.test(trimmedLine);
      
      // Determine icon based on content
      let Icon = Sparkles;
      if (trimmedLine.toLowerCase().includes('rekomendasi') || trimmedLine.toLowerCase().includes('saran')) {
        Icon = Target;
      } else if (trimmedLine.toLowerCase().includes('investasi') || trimmedLine.toLowerCase().includes('saham')) {
        Icon = TrendingUp;
      } else if (trimmedLine.toLowerCase().includes('tabung') || trimmedLine.toLowerCase().includes('saving')) {
        Icon = PiggyBank;
      } else if (trimmedLine.toLowerCase().includes('perlu') || trimmedLine.toLowerCase().includes('perhatian')) {
        Icon = AlertTriangle;
      }

      return (
        <div key={index} className={`flex gap-3 ${isPoint ? 'items-start' : 'items-center'}`}>
          {isPoint && (
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <p className={`text-sm ${isPoint ? 'flex-1' : 'font-medium'} text-foreground leading-relaxed`}>
            {isPoint ? trimmedLine.replace(/^(\d+\.|[-•*])\s*/, '') : trimmedLine}
          </p>
        </div>
      );
    });
  };

  return (
    <Card className="bg-background/40 backdrop-blur-sm border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Financial Insights
          </CardTitle>
          <CardDescription>Analisis komprehensif berdasarkan seluruh data keuangan Anda</CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-white/10"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights ? (
          formatInsights(insights)
        ) : (
          <p className="text-muted-foreground text-sm">
            Tidak ada data keuangan yang tersedia untuk dianalisis. Tambahkan transaksi, investasi, atau data bisnis untuk mendapatkan analisis AI.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIFinancialInsights;
