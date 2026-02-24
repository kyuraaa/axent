import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Validate base64 image
function validateImage(imageBase64: string): { valid: boolean; error?: string } {
  // Check if it starts with data:image/
  if (!imageBase64.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image format: must be a base64 data URL' };
  }

  // Extract and validate MIME type
  const mimeMatch = imageBase64.match(/data:(image\/[a-z]+);base64,/);
  if (!mimeMatch || !ALLOWED_MIME_TYPES.includes(mimeMatch[1])) {
    return { valid: false, error: `Invalid image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  // Calculate decoded size
  const base64Data = imageBase64.split(',')[1];
  if (!base64Data) {
    return { valid: false, error: 'Invalid base64 data' };
  }
  
  const decodedSize = (base64Data.length * 3) / 4;
  if (decodedSize > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid authorization header' }),
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
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image
    const validation = validateImage(image);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing crypto transaction image for user:', user.id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this crypto transaction screenshot and extract the following information in JSON format:
{
  "coin_name": "full cryptocurrency name (e.g., Bitcoin)",
  "symbol": "trading symbol in uppercase (e.g., BTC)",
  "coin_id": "lowercase identifier (e.g., bitcoin)",
  "amount": number (crypto amount purchased),
  "purchase_price": number (price per coin in local currency),
  "purchase_date": "YYYY-MM-DD format",
  "confidence": number (0-1, how confident you are about the extraction)
}

Important:
- Extract the EXACT values shown in the image
- For coin_id, convert the coin name to lowercase and replace spaces with hyphens
- For dates, convert to YYYY-MM-DD format
- Be precise with numbers, don't approximate
- If a field is unclear, set confidence lower and use your best estimate
- Currency should be converted/detected from the image`
              },
              {
                type: 'image_url',
                image_url: { url: image }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response received');

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // Validate extracted data
    if (typeof extractedData.amount !== 'number' || extractedData.amount < 0 || extractedData.amount > 1000000000) {
      throw new Error('Invalid amount in extracted data');
    }
    if (extractedData.purchase_date && !extractedData.purchase_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new Error('Invalid date format');
    }
    
    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-crypto-transaction function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to analyze crypto transaction image'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
