import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ForecastResult {
  predictions: string;
  cogsAnalysis: string;
  recommendations: string;
}

const BusinessForecaster = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    currentRevenue: '',
    currentCogs: '',
    growthRate: '',
    marketConditions: '',
    timeframe: '12',
  });

  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  const generateForecast = async () => {
    if (!formData.businessName || !formData.currentRevenue || !formData.currentCogs) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi data bisnis yang diperlukan',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const prompt = `Sebagai business analyst, analisis dan buat prediksi untuk bisnis berikut:

Nama Bisnis: ${formData.businessName}
Revenue Saat Ini: Rp ${parseFloat(formData.currentRevenue).toLocaleString('id-ID')}
COGS Saat Ini: Rp ${parseFloat(formData.currentCogs).toLocaleString('id-ID')}
Target Pertumbuhan: ${formData.growthRate || 'tidak disebutkan'}%
Kondisi Pasar: ${formData.marketConditions || 'normal'}
Periode Prediksi: ${formData.timeframe} bulan

Berikan analisis dalam format berikut:
1. PREDIKSI BISNIS: Proyeksi revenue dan profit untuk ${formData.timeframe} bulan ke depan
2. ANALISIS COGS: Estimasi COGS dan cara optimasinya
3. REKOMENDASI: 3-5 strategi konkret untuk mencapai target

Gunakan data dan tren industri yang relevan. Berikan angka spesifik dan actionable insights.`;

      const { data, error } = await supabase.functions.invoke('business-forecast', {
        body: { prompt },
      });

      if (error) {
        if (error.message?.includes('429')) {
          throw new Error('Rate limit tercapai. Mohon tunggu beberapa saat.');
        }
        if (error.message?.includes('402')) {
          throw new Error('Kredit AI habis. Mohon top up kredit Anda.');
        }
        throw error;
      }

      if (data?.forecast) {
        const forecastText = data.forecast;
        
        // Parse the response into sections
        const predictionMatch = forecastText.match(/PREDIKSI BISNIS:(.*?)(?=ANALISIS COGS:|$)/s);
        const cogsMatch = forecastText.match(/ANALISIS COGS:(.*?)(?=REKOMENDASI:|$)/s);
        const recommendationsMatch = forecastText.match(/REKOMENDASI:(.*?)$/s);

        setForecast({
          predictions: predictionMatch?.[1]?.trim() || forecastText,
          cogsAnalysis: cogsMatch?.[1]?.trim() || '',
          recommendations: recommendationsMatch?.[1]?.trim() || '',
        });

        toast({
          title: 'Berhasil',
          description: 'Prediksi bisnis berhasil dibuat',
        });
      }
    } catch (error: any) {
      console.error('Forecast error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat prediksi bisnis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Business Forecaster - Prediksi Bisnis & COGS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="businessName">Nama Bisnis</Label>
            <Input
              id="businessName"
              placeholder="Nama bisnis Anda"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="currentRevenue">Revenue Saat Ini (Rp)</Label>
            <Input
              id="currentRevenue"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.currentRevenue}
              onChange={(e) => setFormData({ ...formData, currentRevenue: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="currentCogs">COGS Saat Ini (Rp)</Label>
            <Input
              id="currentCogs"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.currentCogs}
              onChange={(e) => setFormData({ ...formData, currentCogs: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="growthRate">Target Pertumbuhan (%)</Label>
            <Input
              id="growthRate"
              type="number"
              step="0.1"
              placeholder="Contoh: 10"
              value={formData.growthRate}
              onChange={(e) => setFormData({ ...formData, growthRate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="timeframe">Periode Prediksi (bulan)</Label>
            <Input
              id="timeframe"
              type="number"
              placeholder="12"
              value={formData.timeframe}
              onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="marketConditions">Kondisi Pasar & Info Tambahan</Label>
          <Textarea
            id="marketConditions"
            placeholder="Jelaskan kondisi pasar, kompetisi, atau faktor lain yang mempengaruhi bisnis..."
            value={formData.marketConditions}
            onChange={(e) => setFormData({ ...formData, marketConditions: e.target.value })}
            rows={3}
          />
        </div>

        <Button onClick={generateForecast} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Membuat Prediksi...
            </>
          ) : (
            'Buat Prediksi Bisnis'
          )}
        </Button>

        {forecast && (
          <div className="mt-6 space-y-4">
            {forecast.predictions && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-semibold text-primary mb-2">📊 Prediksi Bisnis</h3>
                <div className="text-sm whitespace-pre-line">{forecast.predictions}</div>
              </div>
            )}
            
            {forecast.cogsAnalysis && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h3 className="font-semibold text-accent mb-2">💰 Analisis COGS</h3>
                <div className="text-sm whitespace-pre-line">{forecast.cogsAnalysis}</div>
              </div>
            )}
            
            {forecast.recommendations && (
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <h3 className="font-semibold mb-2">💡 Rekomendasi Strategis</h3>
                <div className="text-sm whitespace-pre-line">{forecast.recommendations}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessForecaster;
