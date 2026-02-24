import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      console.error('No symbols provided or invalid format');
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching stock prices for symbols:', symbols);

    // Format symbols for Indonesian stocks: BBCA.JK for Jakarta Stock Exchange
    const formattedSymbols = symbols.map(s => {
      if (!s.includes('.') && /^[A-Z]{4}$/.test(s)) {
        return `${s}.JK`; // Yahoo Finance uses .JK for Jakarta Stock Exchange
      }
      return s;
    });

    console.log('Formatted symbols for Yahoo Finance:', formattedSymbols);

    // Extract prices from response
    const prices: Record<string, number> = {};
    
    // Use Yahoo Finance API (no key required)
    for (const symbol of formattedSymbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
        console.log('Fetching price for:', symbol);

        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Yahoo Finance API failed for ${symbol}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log(`Yahoo Finance response for ${symbol}:`, JSON.stringify(data, null, 2));

        // Yahoo Finance returns chart data
        const result = data?.chart?.result?.[0];
        const currentPrice = result?.meta?.regularMarketPrice;

        if (currentPrice && currentPrice > 0) {
          // Get the base symbol (remove .JK suffix for Indonesian stocks)
          const baseSymbol = symbol.replace('.JK', '');
          
          prices[baseSymbol] = currentPrice;
          console.log(`Price for ${baseSymbol}: ${currentPrice}`);
        } else {
          console.warn(`No valid price found for ${symbol}, response:`, data);
        }

        // Small delay to be respectful
        if (symbol !== formattedSymbols[formattedSymbols.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        continue;
      }
    }

    // Check for missing symbols
    const requestedSymbols = symbols.map(s => s.replace('.JK', ''));
    const missingSymbols = requestedSymbols.filter(s => !prices[s]);
    
    if (missingSymbols.length > 0) {
      console.warn('Missing prices for symbols:', missingSymbols);
    }

    if (Object.keys(prices).length === 0) {
      throw new Error('No valid prices found for any symbols');
    }

    console.log('Final prices object:', prices);

    return new Response(
      JSON.stringify({ 
        prices,
        timestamp: new Date().toISOString(),
        source: 'yahoo-finance',
        symbols_found: Object.keys(prices).length,
        symbols_requested: symbols.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in stock-prices function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch stock prices',
        details: error.toString(),
        suggestion: 'Check if the stock ticker is correct and try again'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
