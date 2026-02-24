import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    // Validate query parameter type
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedQuery = query.trim();

    // Validate query length
    if (trimmedQuery.length < 1 || trimmedQuery.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Query must be between 1 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate allowed characters (alphanumeric, spaces, basic punctuation)
    if (!/^[a-zA-Z0-9\s.\-]+$/.test(trimmedQuery)) {
      return new Response(
        JSON.stringify({ error: 'Query contains invalid characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    console.log('Searching stocks for query:', trimmedQuery);

    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(trimmedQuery)}&token=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Finnhub API error:', response.status, response.statusText);
      throw new Error(`Finnhub API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Finnhub search response:', JSON.stringify(data, null, 2).slice(0, 500));

    // Filter for Jakarta Stock Exchange stocks (.JK suffix) and format results
    const results = (data.result || [])
      .filter((item: any) => item.symbol && item.symbol.endsWith('.JK'))
      .slice(0, 100)
      .map((item: any) => ({
        symbol: item.symbol.replace('.JK', ''), // Remove .JK suffix for display
        description: item.description || item.symbol,
        type: item.type || 'Common Stock',
      }));

    console.log(`Found ${results.length} Indonesian stocks`);

    return new Response(
      JSON.stringify({ 
        stocks: results,
        count: results.length,
        query: trimmedQuery
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in stock-list function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to search stocks',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
