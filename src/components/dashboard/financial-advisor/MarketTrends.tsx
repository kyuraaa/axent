import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MarketData, AssetClass } from './types';
import { fetchMarketTrends } from './api';
import { RefreshCw } from 'lucide-react';

const MarketTrends = () => {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '1Y' | '5Y'>('1M');
  const [selectedAssets, setSelectedAssets] = useState<AssetClass[]>(['stocks', 'bonds', 'realEstate']);

  // Fetch market trend data
  const { data: marketData, isLoading, error } = useQuery({
    queryKey: ['marketTrends', timeframe],
    queryFn: () => fetchMarketTrends(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as '1M' | '3M' | '1Y' | '5Y');
  };

  const handleAssetToggle = (value: string) => {
    const asset = value as AssetClass;
    
    setSelectedAssets(prev => {
      // If already selected, remove it
      if (prev.includes(asset)) {
        // Don't allow deselecting all assets
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== asset);
      } 
      // Otherwise add it
      return [...prev, asset];
    });
  };

  // Format date based on timeframe
  const formatDate = (date: string) => {
    const d = new Date(date);
    if (timeframe === '5Y') {
      return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    } else if (timeframe === '1Y') {
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(2)}`;
    } else {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
  };

  const assetColors = {
    stocks: '#22c55e', // Budgify green
    bonds: '#3b82f6', // Blue
    realEstate: '#f59e0b', // Amber
  };

  const assetLabels = {
    stocks: 'Stocks',
    bonds: 'Bonds',
    realEstate: 'Real Estate',
  };

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Market Trends</CardTitle>
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="5Y">5 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <ToggleGroup type="multiple" variant="outline" className="justify-start">
            <ToggleGroupItem 
              value="stocks" 
              aria-label="Toggle stocks" 
              data-state={selectedAssets.includes('stocks') ? 'on' : 'off'}
              onClick={() => handleAssetToggle('stocks')}
              className="data-[state=on]:bg-budgify-500/20 data-[state=on]:text-budgify-500 data-[state=on]:border-budgify-500"
            >
              Stocks
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="bonds" 
              aria-label="Toggle bonds" 
              data-state={selectedAssets.includes('bonds') ? 'on' : 'off'}
              onClick={() => handleAssetToggle('bonds')}
              className="data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-500 data-[state=on]:border-blue-500"
            >
              Bonds
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="realEstate" 
              aria-label="Toggle real estate" 
              data-state={selectedAssets.includes('realEstate') ? 'on' : 'off'}
              onClick={() => handleAssetToggle('realEstate')}
              className="data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-500 data-[state=on]:border-amber-500"
            >
              Real Estate
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
            </div>
          ) : error ? (
            <div className="h-full w-full flex items-center justify-center text-destructive">
              Failed to load market data
            </div>
          ) : marketData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={marketData.data}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                  tickFormatter={formatDate}
                  minTickGap={30}
                />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(23, 23, 23, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'rgba(255,255,255,0.9)'
                  }}
                  formatter={(value) => [`${value}`, '']}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px', 
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px' 
                  }} 
                />
                {selectedAssets.includes('stocks') && (
                  <Line 
                    type="monotone" 
                    name="Stocks" 
                    dataKey="stocks" 
                    stroke={assetColors.stocks} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {selectedAssets.includes('bonds') && (
                  <Line 
                    type="monotone" 
                    name="Bonds" 
                    dataKey="bonds" 
                    stroke={assetColors.bonds} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                {selectedAssets.includes('realEstate') && (
                  <Line 
                    type="monotone" 
                    name="Real Estate" 
                    dataKey="realEstate" 
                    stroke={assetColors.realEstate} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-white/5 border border-budgify-500/10">
          <h4 className="font-medium text-budgify-400 text-sm">Market Insight</h4>
          <p className="text-sm text-white/70 mt-1">
            {isLoading ? 'Loading market insights...' : 
             error ? 'Unable to analyze market trends at this time.' :
             timeframe === '1M' ? 'Recent market activity shows moderate volatility with stocks outperforming other asset classes.' :
             timeframe === '3M' ? 'Quarter-to-date performance indicates a bullish trend for stocks with bonds remaining stable.' :
             timeframe === '1Y' ? 'Annual trends show consistent growth across all asset classes with occasional corrections.' :
             'Long-term market analysis demonstrates the effectiveness of diversification across multiple asset classes.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;
