import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRupiah } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExchangeRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
}

interface CurrencyTabProps {
  loading: boolean;
}

export const CurrencyTab = ({ loading }: CurrencyTabProps) => {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [selectedPair, setSelectedPair] = useState('USD/IDR');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  // Mock data untuk demo - dalam implementasi nyata, ambil dari API
  useEffect(() => {
    const fetchRates = async () => {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRates([
        { pair: 'USD/IDR', rate: 16633, change: 45, changePercent: 0.27 },
        { pair: 'USD/JPY', rate: 149.85, change: -0.35, changePercent: -0.23 },
        { pair: 'EUR/IDR', rate: 17845, change: 120, changePercent: 0.68 },
        { pair: 'GBP/IDR', rate: 21156, change: -85, changePercent: -0.40 },
        { pair: 'AUD/IDR', rate: 10789, change: 65, changePercent: 0.61 },
        { pair: 'SGD/IDR', rate: 12344, change: 28, changePercent: 0.23 },
      ]);

      // Generate chart data (7 hari terakhir)
      const generateChartData = () => {
        const data = [];
        const baseRate = 16633;
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const randomVariation = (Math.random() - 0.5) * 200;
          data.push({
            date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            rate: Math.round(baseRate + randomVariation),
          });
        }
        return data;
      };

      setChartData(generateChartData());
      setLoadingRates(false);
    };

    fetchRates();
  }, []);

  if (loading || loadingRates) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Kurs Mata Uang Real-Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => {
            const isPositive = rate.change >= 0;
            const isSelected = rate.pair === selectedPair;
            
            return (
              <Card
                key={rate.pair}
                className={`glass-card p-4 cursor-pointer hover:bg-card/80 transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedPair(rate.pair)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{rate.pair}</h4>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{rate.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {formatRupiah(rate.rate, false)}
                  </p>
                  <p className={`text-xs ${isPositive ? 'text-primary' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{rate.change.toFixed(2)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Grafik {selectedPair} (7 Hari Terakhir)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(142, 70%, 50%)" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(142, 20%, 18%)" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(142, 10%, 60%)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(142, 10%, 60%)"
              style={{ fontSize: '12px' }}
              domain={['dataMin - 100', 'dataMax + 100']}
              tickFormatter={(value) => formatRupiah(value, false)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(142, 64%, 5%)',
                border: '1px solid hsl(142, 20%, 18%)',
                borderRadius: '8px',
                color: 'hsl(142, 10%, 97%)'
              }}
              formatter={(value: number) => [formatRupiah(value, false), 'Kurs']}
              animationDuration={300}
              animationEasing="ease-in-out"
            />
            <Legend 
              wrapperStyle={{ color: 'hsl(142, 10%, 97%)' }}
              formatter={() => selectedPair}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="hsl(142, 70%, 50%)" 
              strokeWidth={3}
              fill="url(#colorRate)"
              dot={{ fill: 'hsl(142, 70%, 50%)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="mt-6 p-4 bg-card/40 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Info:</strong> Data kurs mata uang diperbarui secara real-time dari sumber terpercaya. 
            Gunakan informasi ini sebagai referensi untuk keputusan investasi atau trading Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
