import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const COINMARKETCAP_API_KEY = Deno.env.get('COINMARKETCAP_API_KEY');

    if (!COINMARKETCAP_API_KEY) {
      throw new Error('COINMARKETCAP_API_KEY is not configured');
    }

    console.log('Fetching cryptocurrency list from CoinMarketCap...');

    // Fetch cryptocurrency list with logos
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CoinMarketCap API error:', response.status, errorText);
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fetched ${data.data.length} cryptocurrencies`);

    // Transform the data to a simpler format and deduplicate by symbol
    const cryptoMap = new Map();
    data.data.forEach((crypto: any) => {
      // Keep the first occurrence of each symbol (usually the most popular one)
      if (!cryptoMap.has(crypto.symbol)) {
        cryptoMap.set(crypto.symbol, {
          symbol: crypto.symbol,
          name: crypto.name,
          id: crypto.id,
          slug: crypto.slug,
          logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`,
        });
      }
    });

    const cryptoList = Array.from(cryptoMap.values());
    console.log(`After deduplication: ${cryptoList.length} unique symbols`);

    return new Response(JSON.stringify({ cryptoList }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in crypto-list function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
