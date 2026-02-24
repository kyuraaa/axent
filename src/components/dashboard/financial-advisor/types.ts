
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FinancialInsight {
  title: string;
  description: string;
  recommendation: string;
}

export interface MarketDataPoint {
  date: string;
  stocks: number;
  bonds: number;
  realEstate: number;
}

export interface MarketData {
  label: string;
  timeframe: '1M' | '3M' | '1Y' | '5Y';
  data: MarketDataPoint[];
}

export type AssetClass = 'stocks' | 'bonds' | 'realEstate';
