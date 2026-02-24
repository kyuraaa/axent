
import { FinancialInsight, MarketData, MarketDataPoint } from './types';

// API function for fetching financial insights
export const fetchFinancialInsights = async (): Promise<FinancialInsight[]> => {
  console.log('Fetching financial insights from API...');
  
  try {
    // In a real implementation, this would be an actual API endpoint
    // We're simulating API behavior with a delay for demonstration
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate API data - in a real app, this would be a fetch call
    return [
      {
        title: 'Market Volatility Alert',
        description: 'Recent market fluctuations suggest increased volatility in tech stocks.',
        recommendation: 'Consider rebalancing your portfolio to include more stable dividend stocks.'
      },
      {
        title: 'Interest Rate Trends',
        description: 'Current Fed policy suggests interest rates may rise in the coming months.',
        recommendation: 'Consider refinancing loans at current rates or investing in short-term CDs.'
      },
      {
        title: 'Sector Performance',
        description: 'The energy sector has outperformed technology in the last quarter.',
        recommendation: 'Consider diversifying into renewable energy investments.'
      }
    ];
  } catch (error) {
    console.error('Error fetching market insights:', error);
    throw new Error('Failed to fetch market insights');
  }
};

// API function for fetching historical market data trends
export const fetchMarketTrends = async (timeframe: '1M' | '3M' | '1Y' | '5Y'): Promise<MarketData> => {
  console.log(`Fetching market trends for timeframe: ${timeframe}...`);
  
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock data based on timeframe
    const today = new Date();
    const data: MarketDataPoint[] = [];
    
    let days: number;
    let interval: number;
    let label: string;
    
    switch (timeframe) {
      case '1M':
        days = 30;
        interval = 1;
        label = '1 Month';
        break;
      case '3M':
        days = 90;
        interval = 3;
        label = '3 Months';
        break;
      case '1Y':
        days = 365;
        interval = 12;
        label = '1 Year';
        break;
      case '5Y':
        days = 365 * 5;
        interval = 60;
        label = '5 Years';
        break;
    }
    
    // Generate data points
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create realistic but random variations that still trend upward over time
      // with some volatility and correlations between asset classes
      const baseStocks = 100 + (days - i) * 0.5;
      const baseBonds = 100 + (days - i) * 0.3;
      const baseRealEstate = 100 + (days - i) * 0.4;
      
      // Add some volatility
      const volatility = timeframe === '1M' ? 3 : timeframe === '3M' ? 5 : timeframe === '1Y' ? 8 : 15;
      const stockVolatility = (Math.random() - 0.5) * volatility;
      const bondVolatility = (Math.random() - 0.5) * (volatility * 0.6);  // Bonds are less volatile
      const realEstateVolatility = (Math.random() - 0.5) * (volatility * 0.8);
      
      data.push({
        date: date.toISOString().split('T')[0],  // YYYY-MM-DD format
        stocks: Math.round((baseStocks + stockVolatility) * 100) / 100,
        bonds: Math.round((baseBonds + bondVolatility) * 100) / 100,
        realEstate: Math.round((baseRealEstate + realEstateVolatility) * 100) / 100
      });
    }
    
    return {
      timeframe,
      label,
      data
    };
  } catch (error) {
    console.error('Error fetching market trends:', error);
    throw new Error('Failed to fetch market trends');
  }
};
