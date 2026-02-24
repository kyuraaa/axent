import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    console.log('Fetching real-time USD to IDR exchange rate...');

    // Using frankfurter.app - free API, no auth required
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=IDR'
    );

    if (!response.ok) {
      console.error('Exchange rate API error:', response.status);
      // Fallback to default rate if API fails
      return new Response(
        JSON.stringify({ 
          rate: 15700, 
          source: 'fallback',
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    const rate = data.rates?.IDR || 15700;

    console.log('Exchange rate fetched successfully:', rate);

    return new Response(
      JSON.stringify({ 
        rate, 
        source: 'frankfurter',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Return fallback rate on error
    return new Response(
      JSON.stringify({ 
        rate: 15700, 
        source: 'fallback',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
