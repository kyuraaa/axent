
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FinancialInsight } from './types';

interface MarketInsightsProps {
  insights: FinancialInsight[] | undefined;
  isLoading: boolean;
}

const MarketInsights = ({ insights, isLoading }: MarketInsightsProps) => {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Real-Time Market Insights</h3>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 bg-white/5 rounded-lg animate-pulse"></div>
          <div className="h-20 bg-white/5 rounded-lg animate-pulse"></div>
        </div>
      ) : insights ? (
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="p-3 rounded-lg bg-white/5 border border-budgify-500/10">
              <h4 className="font-medium text-budgify-400">{insight.title}</h4>
              <p className="text-sm text-white/70 mt-1">{insight.description}</p>
              <p className="text-sm font-medium mt-2 text-white/90">Recommendation: {insight.recommendation}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-white/50 text-sm">Unable to fetch market insights</div>
      )}
    </Card>
  );
};

export default MarketInsights;
