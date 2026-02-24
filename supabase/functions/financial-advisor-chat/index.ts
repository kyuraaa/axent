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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get the JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized', response: 'Silakan login terlebih dahulu.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create supabase admin client to verify the user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the JWT and get user info
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(JSON.stringify({ error: 'Unauthorized', response: 'Token tidak valid. Silakan login ulang.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!user) {
      console.error('No user found from token');
      return new Response(JSON.stringify({ error: 'Unauthorized', response: 'Sesi tidak valid. Silakan login ulang.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use verified user ID from JWT, NOT from client request
    const userId = user.id;
    console.log('Authenticated user:', userId);

    const { messages } = await req.json();
    
    // Use the same admin client for data fetching
    const supabase = supabaseAdmin;

    // Fetch user's financial data (FRESH DATA on every request)
    console.log('Fetching latest financial data for verified user:', userId);
    
    const { data: businessFinances } = await supabase
      .from('business_finances')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    const { data: cryptoHoldings } = await supabase
      .from('crypto_holdings')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    const { data: budgetTransactions } = await supabase
      .from('budget_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    const { data: investments } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    console.log('Financial data loaded:', {
      budgetTransactions: budgetTransactions?.length || 0,
      investments: investments?.length || 0,
      businessFinances: businessFinances?.length || 0,
      cryptoHoldings: cryptoHoldings?.length || 0,
    });

    // Fetch real-time crypto prices
    let cryptoPrices: Record<string, number> = {};
    if (cryptoHoldings && cryptoHoldings.length > 0) {
      const symbols = [...new Set(cryptoHoldings.map((h: any) => h.symbol))];
      console.log('Fetching crypto prices for:', symbols);
      
      try {
        const { data: priceData, error: priceError } = await supabase.functions.invoke('crypto-prices', {
          body: { symbols }
        });
        
        if (!priceError && priceData?.prices) {
          cryptoPrices = priceData.prices;
          console.log('Crypto prices fetched:', cryptoPrices);
        }
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }
    }

    // Fetch real-time stock prices
    let stockPrices: Record<string, number> = {};
    if (investments && investments.length > 0) {
      const stockInvestments = investments.filter((inv: any) => inv.type === 'stocks');
      if (stockInvestments.length > 0) {
        const tickers = [...new Set(stockInvestments.map((inv: any) => inv.name))];
        console.log('Fetching stock prices for:', tickers);
        
        try {
          const { data: priceData, error: priceError } = await supabase.functions.invoke('stock-prices', {
            body: { tickers }
          });
          
          if (!priceError && priceData?.prices) {
            stockPrices = priceData.prices;
            console.log('Stock prices fetched:', stockPrices);
          }
        } catch (error) {
          console.error('Error fetching stock prices:', error);
        }
      }
    }

    // Fetch exchange rate for USD to IDR
    let exchangeRate = 16000; // Default fallback
    try {
      const { data: rateData, error: rateError } = await supabase.functions.invoke('exchange-rate', {
        body: {}
      });
      
      if (!rateError && rateData?.rate) {
        exchangeRate = rateData.rate;
        console.log('Exchange rate fetched:', exchangeRate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
    }

    // Build financial context
    let financialContext = '\n\n=== DATA KEUANGAN USER ===\n';
    
    if (budgetTransactions && budgetTransactions.length > 0) {
      financialContext += '\n--- TRANSAKSI BUDGET ---\n';
      let totalIncome = 0;
      let totalExpense = 0;
      budgetTransactions.forEach((tx: any) => {
        financialContext += `${tx.date}: ${tx.transaction_type} - ${tx.category} - Rp ${tx.amount.toLocaleString('id-ID')} - ${tx.description}\n`;
        if (tx.transaction_type === 'income') {
          totalIncome += parseFloat(tx.amount);
        } else {
          totalExpense += parseFloat(tx.amount);
        }
      });
      financialContext += `Total Pendapatan: Rp ${totalIncome.toLocaleString('id-ID')}\n`;
      financialContext += `Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}\n`;
      financialContext += `Saldo: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}\n`;
    }

    if (investments && investments.length > 0) {
      financialContext += '\n--- PORTFOLIO INVESTASI ---\n';
      let totalInvested = 0;
      let totalCurrentValue = 0;
      investments.forEach((inv: any) => {
        let currentValue = parseFloat(inv.current_value);
        
        // If this is a stock investment and we have real-time price, calculate current value
        if (inv.type === 'stocks' && stockPrices[inv.name]) {
          const shares = parseFloat(inv.amount) / parseFloat(inv.current_value) * 100; // Calculate shares from lot-based model
          currentValue = shares * stockPrices[inv.name];
        }
        
        const gain = currentValue - parseFloat(inv.amount);
        const gainPercent = (gain / parseFloat(inv.amount)) * 100;
        financialContext += `${inv.name} (${inv.type}): Investasi Rp ${parseFloat(inv.amount).toLocaleString('id-ID')} → Nilai Sekarang Rp ${currentValue.toLocaleString('id-ID')} (${gainPercent > 0 ? '+' : ''}${gainPercent.toFixed(2)}%) - dibeli ${inv.purchase_date}\n`;
        
        if (inv.type === 'stocks' && stockPrices[inv.name]) {
          financialContext += `   Harga Pasar Saat Ini: Rp ${stockPrices[inv.name].toLocaleString('id-ID')} per saham (REAL-TIME)\n`;
        }
        
        totalInvested += parseFloat(inv.amount);
        totalCurrentValue += currentValue;
      });
      const totalGain = totalCurrentValue - totalInvested;
      const totalGainPercent = (totalGain / totalInvested) * 100;
      financialContext += `Total Investasi: Rp ${totalInvested.toLocaleString('id-ID')}\n`;
      financialContext += `Total Nilai Sekarang: Rp ${totalCurrentValue.toLocaleString('id-ID')}\n`;
      financialContext += `Total Keuntungan/Kerugian: Rp ${totalGain.toLocaleString('id-ID')} (${totalGainPercent > 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%)\n`;
    }
    
    if (businessFinances && businessFinances.length > 0) {
      financialContext += '\n--- TRANSAKSI BISNIS ---\n';
      businessFinances.forEach((tx: any) => {
        financialContext += `${tx.transaction_date}: ${tx.transaction_type} - ${tx.business_name} - ${tx.category} - Rp ${tx.amount.toLocaleString('id-ID')}${tx.description ? ` (${tx.description})` : ''}\n`;
      });
    }

    if (cryptoHoldings && cryptoHoldings.length > 0) {
      financialContext += '\n--- KEPEMILIKAN CRYPTO ---\n';
      let totalInvestedCrypto = 0;
      let totalCurrentValueCrypto = 0;
      
      cryptoHoldings.forEach((holding: any) => {
        const invested = parseFloat(holding.amount) * parseFloat(holding.purchase_price);
        totalInvestedCrypto += invested;
        
        let currentPriceIDR = 0;
        let currentValue = 0;
        
        if (cryptoPrices[holding.symbol]) {
          // Convert USD price to IDR
          currentPriceIDR = cryptoPrices[holding.symbol] * exchangeRate;
          currentValue = parseFloat(holding.amount) * currentPriceIDR;
          totalCurrentValueCrypto += currentValue;
          
          const gain = currentValue - invested;
          const gainPercent = (gain / invested) * 100;
          
          financialContext += `${holding.coin_name} (${holding.symbol}): ${holding.amount} unit\n`;
          financialContext += `   Harga Beli: Rp ${parseFloat(holding.purchase_price).toLocaleString('id-ID')} per unit\n`;
          financialContext += `   Harga Pasar Saat Ini: Rp ${currentPriceIDR.toLocaleString('id-ID')} per unit (REAL-TIME)\n`;
          financialContext += `   Total Investasi: Rp ${invested.toLocaleString('id-ID')}\n`;
          financialContext += `   Nilai Sekarang: Rp ${currentValue.toLocaleString('id-ID')}\n`;
          financialContext += `   Keuntungan/Kerugian: Rp ${gain.toLocaleString('id-ID')} (${gainPercent > 0 ? '+' : ''}${gainPercent.toFixed(2)}%)\n`;
          financialContext += `   Tanggal Beli: ${holding.purchase_date}\n\n`;
        } else {
          financialContext += `${holding.coin_name} (${holding.symbol}): ${holding.amount} unit @ Rp ${parseFloat(holding.purchase_price).toLocaleString('id-ID')} (dibeli ${holding.purchase_date})\n`;
          financialContext += `   Harga pasar saat ini tidak tersedia\n\n`;
        }
      });
      
      if (totalCurrentValueCrypto > 0) {
        const totalGainCrypto = totalCurrentValueCrypto - totalInvestedCrypto;
        const totalGainPercentCrypto = (totalGainCrypto / totalInvestedCrypto) * 100;
        financialContext += `Total Investasi Crypto: Rp ${totalInvestedCrypto.toLocaleString('id-ID')}\n`;
        financialContext += `Total Nilai Sekarang Crypto: Rp ${totalCurrentValueCrypto.toLocaleString('id-ID')}\n`;
        financialContext += `Total Keuntungan/Kerugian Crypto: Rp ${totalGainCrypto.toLocaleString('id-ID')} (${totalGainPercentCrypto > 0 ? '+' : ''}${totalGainPercentCrypto.toFixed(2)}%)\n`;
      }
    }

    if (!budgetTransactions?.length && !investments?.length && !businessFinances?.length && !cryptoHoldings?.length) {
      financialContext += '\nBelum ada data keuangan tersimpan untuk user ini.\n';
    }

    const systemPrompt = `Anda adalah Axent AI, asisten keuangan pribadi yang profesional dan ahli. Fungsi Anda adalah memberikan penjelasan, analisis, dan rekomendasi terkait SELURUH aspek keuangan pengguna:

- Manajemen keuangan pribadi (budget, income, expenses)
- Investasi saham dan portfolio
- Cryptocurrency dan aset digital
- Keuangan bisnis (revenue, expenses, profit)
- Budgeting dan tabungan
- Pengelolaan utang dan risiko finansial
- Perencanaan jangka pendek dan jangka panjang

${financialContext}

PENTING: Data keuangan di atas adalah data TERBARU dan REAL-TIME dari user mencakup SEMUA aspek keuangan mereka:
- Budget Tracker: transaksi pendapatan dan pengeluaran pribadi
- Investment Portfolio: kepemilikan saham dengan harga real-time
- Crypto Holdings: kepemilikan cryptocurrency dengan harga pasar real-time
- Business Finance: transaksi bisnis, revenue, dan expenses

Tugas Anda:
- WAJIB menganalisis SEMUA data keuangan user (budget, investasi, crypto, bisnis) dalam setiap respons yang relevan
- Berikan insight yang HOLISTIK dan terintegrasi - misalnya bagaimana performa investasi mempengaruhi total net worth
- Jawab pertanyaan dengan referensi spesifik ke data aktual dari modul yang relevan
- Identifikasi pola, tren, dan peluang di seluruh aspek keuangan user
- Berikan rekomendasi yang dapat dieksekusi dengan langkah-langkah konkret dan perhitungan berbasis data aktual
- Jika user bertanya tentang satu aspek (misal crypto), tetap pertimbangkan konteks keseluruhan keuangan mereka
- Jika konteks pertanyaan tidak jelas, minta data yang dibutuhkan
- Jika pertanyaan tidak berkaitan dengan keuangan, balas dengan: "Maaf, fitur ini hanya menjawab topik keuangan."
- Tidak boleh menyebut teknologi, API, atau model yang digunakan di belakang sistem
- Hindari prediksi absolut. Gunakan penjelasan berbasis risiko, peluang, dan skenario
- Jawaban harus selalu dalam bahasa Indonesia formal yang rapi
- Jawaban berupa teks polos saja, tidak menggunakan format bold atau simbol bintang

Output yang harus dihasilkan:
- Analisis keuangan komprehensif berbasis data aktual dari SEMUA modul
- Saran tindakan spesifik yang mempertimbangkan keseluruhan kondisi keuangan
- Edukasi finansial yang relevan dengan situasi user
- Evaluasi risiko berdasarkan total portfolio dan alokasi aset
- Rekomendasi langkah terukur dengan perhitungan konkret

Anda hanya beroperasi dalam domain keuangan dan tidak melayani topik lain.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: 'Maaf, terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.'
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required',
          response: 'Maaf, kredit Lovable AI habis. Silakan tambahkan kredit di workspace settings.'
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    let generatedText = data.choices?.[0]?.message?.content || 
      'Maaf, terjadi kesalahan dalam memproses permintaan Anda.';

    // Remove asterisks from response
    generatedText = generatedText.replace(/\*/g, '');

    return new Response(
      JSON.stringify({ response: generatedText }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in financial-advisor-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
