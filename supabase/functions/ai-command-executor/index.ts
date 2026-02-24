import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define available tools for the AI
const availableTools = [
  {
    type: "function",
    function: {
      name: "add_budget_transaction",
      description: "Add a new income or expense transaction to the budget tracker. Use this when user wants to add income (pemasukan) or expense (pengeluaran).",
      parameters: {
        type: "object",
        properties: {
          transaction_type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Type of transaction - 'income' for pemasukan, 'expense' for pengeluaran"
          },
          amount: {
            type: "number",
            description: "The amount in Indonesian Rupiah (IDR)"
          },
          category: {
            type: "string",
            description: "Category of transaction (e.g., 'Gaji', 'Makanan', 'Transport', 'Freelance', 'Investasi', 'Hiburan', 'Utilities', 'Belanja', 'Kesehatan', 'Pendidikan', 'Lainnya')"
          },
          description: {
            type: "string",
            description: "Description of the transaction"
          }
        },
        required: ["transaction_type", "amount", "category", "description"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_investment",
      description: "Add a new investment to the portfolio. Use this when user wants to add stocks, bonds, mutual funds, or other investments.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name or ticker of the investment"
          },
          type: {
            type: "string",
            enum: ["stocks", "bonds", "mutual_funds", "real_estate", "gold", "other"],
            description: "Type of investment"
          },
          amount: {
            type: "number",
            description: "Amount invested in IDR"
          },
          current_value: {
            type: "number",
            description: "Current value in IDR (use same as amount if just purchased)"
          }
        },
        required: ["name", "type", "amount", "current_value"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_crypto_holding",
      description: "Add a new cryptocurrency holding. Use this when user wants to add Bitcoin, Ethereum, or other crypto assets.",
      parameters: {
        type: "object",
        properties: {
          coin_id: {
            type: "string",
            description: "CoinGecko ID of the cryptocurrency (e.g., 'bitcoin', 'ethereum', 'solana')"
          },
          coin_name: {
            type: "string",
            description: "Full name of the cryptocurrency"
          },
          symbol: {
            type: "string",
            description: "Symbol of the cryptocurrency (e.g., 'BTC', 'ETH')"
          },
          amount: {
            type: "number",
            description: "Amount of cryptocurrency units"
          },
          purchase_price: {
            type: "number",
            description: "Purchase price per unit in IDR"
          }
        },
        required: ["coin_id", "coin_name", "symbol", "amount", "purchase_price"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_financial_goal",
      description: "Add a new financial goal. Use this when user wants to set savings targets or financial objectives.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the financial goal"
          },
          target_amount: {
            type: "number",
            description: "Target amount to save in IDR"
          },
          current_amount: {
            type: "number",
            description: "Current saved amount in IDR"
          },
          category: {
            type: "string",
            enum: ["savings", "investment", "emergency", "vacation", "education", "retirement", "property", "other"],
            description: "Category of the goal"
          },
          deadline: {
            type: "string",
            description: "Target deadline in YYYY-MM-DD format (optional)"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Priority level of the goal"
          }
        },
        required: ["name", "target_amount", "category", "priority"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_business_transaction",
      description: "Add a business income or expense transaction. Use this for business finances.",
      parameters: {
        type: "object",
        properties: {
          business_name: {
            type: "string",
            description: "Name of the business"
          },
          transaction_type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Type of business transaction"
          },
          category: {
            type: "string",
            description: "Category (e.g., 'Sales', 'Services', 'Operating', 'Marketing', 'Salary', 'Utilities', 'Inventory', 'Other')"
          },
          amount: {
            type: "number",
            description: "Amount in IDR"
          },
          description: {
            type: "string",
            description: "Description of the transaction"
          }
        },
        required: ["business_name", "transaction_type", "category", "amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_debt",
      description: "Add a new debt record. Use this when user wants to track loans or debts.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the debt"
          },
          creditor: {
            type: "string",
            description: "Name of the creditor/lender"
          },
          total_amount: {
            type: "number",
            description: "Total debt amount in IDR"
          },
          remaining_amount: {
            type: "number",
            description: "Remaining amount to pay in IDR"
          },
          interest_rate: {
            type: "number",
            description: "Interest rate percentage (optional)"
          },
          minimum_payment: {
            type: "number",
            description: "Minimum monthly payment in IDR (optional)"
          },
          due_date: {
            type: "string",
            description: "Due date in YYYY-MM-DD format (optional)"
          }
        },
        required: ["name", "creditor", "total_amount", "remaining_amount"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_recurring_transaction",
      description: "Add a recurring income or expense. Use this for subscriptions, bills, or regular payments.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the recurring transaction"
          },
          transaction_type: {
            type: "string",
            enum: ["income", "expense"],
            description: "Type of recurring transaction"
          },
          amount: {
            type: "number",
            description: "Amount in IDR"
          },
          category: {
            type: "string",
            description: "Category of the transaction"
          },
          frequency: {
            type: "string",
            enum: ["daily", "weekly", "monthly", "yearly"],
            description: "How often the transaction occurs"
          },
          next_due_date: {
            type: "string",
            description: "Next due date in YYYY-MM-DD format"
          }
        },
        required: ["name", "transaction_type", "amount", "category", "frequency", "next_due_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "Get a summary of user's financial data including total income, expenses, investments, and net worth.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = user.id;
    const { message } = await req.json();

    console.log('Processing command:', message);

    // First, call AI to understand the command and determine which tool to use
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
            content: `Anda adalah Axent AI, asisten keuangan yang dapat mengeksekusi perintah pengguna untuk mengelola keuangan mereka.

Tanggal hari ini: ${new Date().toISOString().split('T')[0]}

Tugas Anda:
1. Pahami perintah pengguna dalam bahasa Indonesia
2. Tentukan tool yang tepat untuk digunakan
3. Ekstrak parameter yang diperlukan dari perintah
4. Jika perintah tidak jelas, minta klarifikasi

Contoh perintah:
- "Tambah pemasukan gaji 10 juta" → add_budget_transaction (income, 10000000, Gaji, Gaji bulanan)
- "Catat pengeluaran makan 50 ribu" → add_budget_transaction (expense, 50000, Makanan, Makan)
- "Beli 0.1 Bitcoin di harga 800 juta" → add_crypto_holding
- "Investasi saham BBCA 5 juta" → add_investment
- "Set target nabung 50 juta untuk liburan" → add_financial_goal
- "Tambah hutang ke Bank BCA 100 juta" → add_debt
- "Langganan Netflix 150 ribu per bulan" → add_recurring_transaction
- "Berapa total keuangan saya?" → get_financial_summary

Selalu gunakan Rupiah (IDR) untuk semua nilai uang. Konversi format seperti:
- "10 juta" = 10000000
- "500 ribu" = 500000
- "1,5 juta" = 1500000

Untuk next_due_date, gunakan tanggal hari ini jika tidak disebutkan.`
          },
          { role: 'user', content: message }
        ],
        tools: availableTools,
        tool_choice: 'auto'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI error:', response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message;

    console.log('AI response:', JSON.stringify(aiMessage, null, 2));

    // Check if AI wants to call a tool
    if (aiMessage?.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log('Executing tool:', functionName, args);

      let result: any = null;
      let successMessage = '';

      // Get current date in ISO format
      const currentDate = new Date().toISOString();
      const currentDateOnly = new Date().toISOString().split('T')[0];

      switch (functionName) {
        case 'add_budget_transaction':
          console.log('Inserting budget transaction:', {
            user_id: userId,
            transaction_type: args.transaction_type,
            amount: args.amount,
            category: args.category,
            description: args.description
          });
          
          const { data: budgetData, error: budgetError } = await supabase
            .from('budget_transactions')
            .insert({
              user_id: userId,
              transaction_type: args.transaction_type,
              amount: args.amount,
              category: args.category,
              description: args.description,
              date: currentDate // Use ISO timestamp
            })
            .select()
            .single();
          
          if (budgetError) {
            console.error('Budget insert error:', budgetError);
            throw budgetError;
          }
          
          console.log('Budget transaction inserted:', budgetData);
          
          const typeText = args.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran';
          successMessage = `✅ ${typeText} sebesar Rp ${args.amount.toLocaleString('id-ID')} untuk kategori "${args.category}" berhasil disimpan ke database dengan tanggal ${new Date().toLocaleDateString('id-ID')}.`;
          result = { action: 'add_budget_transaction', success: true, data: budgetData };
          break;

        case 'add_investment':
          console.log('Inserting investment:', args);
          
          const { data: investData, error: investError } = await supabase
            .from('investments')
            .insert({
              user_id: userId,
              name: args.name,
              type: args.type,
              amount: args.amount,
              current_value: args.current_value || args.amount,
              purchase_date: currentDate
            })
            .select()
            .single();
          
          if (investError) {
            console.error('Investment insert error:', investError);
            throw investError;
          }
          
          console.log('Investment inserted:', investData);
          successMessage = `✅ Investasi ${args.name} (${args.type}) sebesar Rp ${args.amount.toLocaleString('id-ID')} berhasil disimpan ke portfolio dengan tanggal ${new Date().toLocaleDateString('id-ID')}.`;
          result = { action: 'add_investment', success: true, data: investData };
          break;

        case 'add_crypto_holding':
          console.log('Inserting crypto holding:', args);
          
          const { data: cryptoData, error: cryptoError } = await supabase
            .from('crypto_holdings')
            .insert({
              user_id: userId,
              coin_id: args.coin_id,
              coin_name: args.coin_name,
              symbol: args.symbol.toUpperCase(),
              amount: args.amount,
              purchase_price: args.purchase_price,
              purchase_date: currentDate
            })
            .select()
            .single();
          
          if (cryptoError) {
            console.error('Crypto insert error:', cryptoError);
            throw cryptoError;
          }
          
          console.log('Crypto inserted:', cryptoData);
          successMessage = `✅ Kepemilikan ${args.amount} ${args.symbol.toUpperCase()} (${args.coin_name}) berhasil disimpan dengan harga beli Rp ${args.purchase_price.toLocaleString('id-ID')} per unit (tanggal ${new Date().toLocaleDateString('id-ID')}).`;
          result = { action: 'add_crypto_holding', success: true, data: cryptoData };
          break;

        case 'add_financial_goal':
          console.log('Inserting financial goal:', args);
          
          const { data: goalData, error: goalError } = await supabase
            .from('financial_goals')
            .insert({
              user_id: userId,
              name: args.name,
              target_amount: args.target_amount,
              current_amount: args.current_amount || 0,
              category: args.category,
              priority: args.priority,
              deadline: args.deadline || null
            })
            .select()
            .single();
          
          if (goalError) {
            console.error('Goal insert error:', goalError);
            throw goalError;
          }
          
          console.log('Goal inserted:', goalData);
          successMessage = `✅ Target keuangan "${args.name}" dengan goal Rp ${args.target_amount.toLocaleString('id-ID')} berhasil disimpan.`;
          result = { action: 'add_financial_goal', success: true, data: goalData };
          break;

        case 'add_business_transaction':
          console.log('Inserting business transaction:', args);
          
          // Map transaction_type to Indonesian format used in app
          const bizTransactionType = args.transaction_type === 'income' ? 'pemasukan' : 'pengeluaran';
          
          const { data: bizData, error: bizError } = await supabase
            .from('business_finances')
            .insert({
              user_id: userId,
              business_name: args.business_name,
              transaction_type: bizTransactionType,
              category: args.category,
              amount: args.amount,
              description: args.description || null,
              transaction_date: currentDate
            })
            .select()
            .single();
          
          if (bizError) {
            console.error('Business insert error:', bizError);
            throw bizError;
          }
          
          console.log('Business transaction inserted:', bizData);
          const bizType = args.transaction_type === 'income' ? 'Pemasukan bisnis' : 'Pengeluaran bisnis';
          successMessage = `✅ ${bizType} untuk ${args.business_name} sebesar Rp ${args.amount.toLocaleString('id-ID')} berhasil disimpan (tanggal ${new Date().toLocaleDateString('id-ID')}).`;
          result = { action: 'add_business_transaction', success: true, data: bizData };
          break;

        case 'add_debt':
          console.log('Inserting debt:', args);
          
          const { data: debtData, error: debtError } = await supabase
            .from('debts')
            .insert({
              user_id: userId,
              name: args.name,
              creditor: args.creditor,
              total_amount: args.total_amount,
              remaining_amount: args.remaining_amount,
              interest_rate: args.interest_rate || 0,
              minimum_payment: args.minimum_payment || 0,
              due_date: args.due_date || null
            })
            .select()
            .single();
          
          if (debtError) {
            console.error('Debt insert error:', debtError);
            throw debtError;
          }
          
          console.log('Debt inserted:', debtData);
          successMessage = `✅ Hutang "${args.name}" kepada ${args.creditor} sebesar Rp ${args.total_amount.toLocaleString('id-ID')} berhasil disimpan.`;
          result = { action: 'add_debt', success: true, data: debtData };
          break;

        case 'add_recurring_transaction':
          console.log('Inserting recurring transaction:', args);
          
          const { data: recurData, error: recurError } = await supabase
            .from('recurring_transactions')
            .insert({
              user_id: userId,
              name: args.name,
              transaction_type: args.transaction_type,
              amount: args.amount,
              category: args.category,
              frequency: args.frequency,
              next_due_date: args.next_due_date || currentDateOnly
            })
            .select()
            .single();
          
          if (recurError) {
            console.error('Recurring insert error:', recurError);
            throw recurError;
          }
          
          console.log('Recurring transaction inserted:', recurData);
          successMessage = `✅ Transaksi berulang "${args.name}" sebesar Rp ${args.amount.toLocaleString('id-ID')} (${args.frequency}) berhasil disimpan.`;
          result = { action: 'add_recurring_transaction', success: true, data: recurData };
          break;

        case 'get_financial_summary':
          // Fetch all financial data
          const [budgetRes, investRes, cryptoRes, debtRes] = await Promise.all([
            supabase.from('budget_transactions').select('*').eq('user_id', userId),
            supabase.from('investments').select('*').eq('user_id', userId),
            supabase.from('crypto_holdings').select('*').eq('user_id', userId),
            supabase.from('debts').select('*').eq('user_id', userId)
          ]);

          let totalIncome = 0, totalExpense = 0, totalInvestment = 0, totalCrypto = 0, totalDebt = 0;

          budgetRes.data?.forEach((tx: any) => {
            if (tx.transaction_type === 'income') totalIncome += tx.amount;
            else totalExpense += tx.amount;
          });

          investRes.data?.forEach((inv: any) => {
            totalInvestment += inv.current_value;
          });

          cryptoRes.data?.forEach((h: any) => {
            totalCrypto += h.amount * h.purchase_price;
          });

          debtRes.data?.forEach((d: any) => {
            totalDebt += d.remaining_amount;
          });

          const netWorth = totalIncome - totalExpense + totalInvestment + totalCrypto - totalDebt;

          successMessage = `Ringkasan Keuangan Anda:

Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
Saldo: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}

Portfolio Investasi: Rp ${totalInvestment.toLocaleString('id-ID')}
Portfolio Crypto: Rp ${totalCrypto.toLocaleString('id-ID')}
Total Hutang: Rp ${totalDebt.toLocaleString('id-ID')}

Estimasi Net Worth: Rp ${netWorth.toLocaleString('id-ID')}`;
          result = { action: 'get_financial_summary', success: true };
          break;

        default:
          successMessage = 'Perintah tidak dikenali.';
          result = { action: 'unknown', success: false };
      }

      return new Response(
        JSON.stringify({
          response: successMessage,
          action: result,
          executed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no tool call, return the AI's text response
    const textResponse = aiMessage?.content || 'Maaf, saya tidak memahami perintah Anda. Silakan coba dengan format yang berbeda.';

    return new Response(
      JSON.stringify({
        response: textResponse,
        executed: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
