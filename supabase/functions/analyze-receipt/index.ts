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

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate image
    const validation = validateImage(imageBase64);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing receipt with Lovable AI for user:', user.id);

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
            role: 'system',
            content: `You are a receipt analyzer. Extract transaction information from receipt images.
IMPORTANT: This is for EXPENSE tracking only.
Return a JSON object with this exact structure:
{
  "description": "short description of purchase",
  "amount": number (total amount),
  "category": "one of: food, transportation, shopping, bills, entertainment, health, education, other",
  "merchant": "store/merchant name",
  "date": "YYYY-MM-DD format",
  "time": "HH:MM:SS format (24-hour), if not visible use 12:00:00",
  "confidence": "high/medium/low"
}
CRITICAL: Always extract the time from receipt if visible. Look for timestamp, time printed on receipt.
If you cannot read the receipt clearly, set confidence to "low" and provide best estimates.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this receipt and extract the transaction information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Kredit AI habis. Silakan hubungi administrator.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to analyze receipt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI Response received');

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from AI response
    let extractedData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(aiContent);
      }

      // Validate extracted data
      if (typeof extractedData.amount !== 'number' || extractedData.amount < 0 || extractedData.amount > 1000000000) {
        throw new Error('Invalid amount in extracted data');
      }
      if (extractedData.date && !extractedData.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Invalid date format');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse receipt data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted data for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        data: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-receipt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
