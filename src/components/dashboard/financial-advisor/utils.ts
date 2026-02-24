
import { FinancialInsight } from './types';

export const generateResponse = (userInput: string, insights: FinancialInsight[] | undefined): string => {
  let response = '';
  userInput = userInput.toLowerCase();
  
  if (userInput.includes('investment') || userInput.includes('invest') || userInput.includes('stock')) {
    response = "For investment advice, I recommend a diversified portfolio that matches your risk tolerance. Consider a mix of stocks, bonds, and ETFs. For beginners, index funds like S&P 500 ETFs provide broad market exposure with lower risk. Remember that investments should align with your time horizon - longer-term goals can tolerate more risk. Would you like more specific investment recommendations based on your financial situation?";
  }
  else if (userInput.includes('budget') || userInput.includes('spending') || userInput.includes('save money')) {
    response = "Creating an effective budget starts with tracking all expenses. I recommend the 50/30/20 rule: 50% for necessities, 30% for wants, and 20% for savings and debt repayment. To save more, identify non-essential spending and set specific saving goals. Automating transfers to savings accounts on payday can also help build savings consistently. Would you like help creating a personalized budget plan?";
  }
  else if (userInput.includes('debt') || userInput.includes('loan') || userInput.includes('credit card')) {
    response = "To tackle debt effectively, start by listing all debts with their interest rates. Focus on high-interest debt first (typically credit cards) while making minimum payments on others. Consider debt consolidation if you have multiple high-interest debts. For student loans, look into income-driven repayment plans or refinancing options. Creating a dedicated debt payoff fund in your budget can accelerate your progress. Would you like to discuss specific strategies for your situation?";
  }
  else if (userInput.includes('retirement') || userInput.includes('401k') || userInput.includes('ira')) {
    response = "For retirement planning, start by maximizing employer-matched contributions to 401(k) plans - this is essentially free money. Consider opening a Roth IRA for tax-free growth if you're eligible. Aim to save 15% of your income for retirement, including employer matches. The power of compound interest means starting early is crucial, even with small amounts. Would you like to discuss how much you might need for retirement based on your lifestyle expectations?";
  }
  else if (userInput.includes('house') || userInput.includes('mortgage') || userInput.includes('real estate')) {
    response = "When planning to buy a home, save for a 20% down payment to avoid private mortgage insurance. Your housing costs should ideally not exceed 28% of your gross monthly income. Beyond the purchase price, budget for closing costs (2-5%), ongoing maintenance (1-3% annually), property taxes, and insurance. Consider getting pre-approved for a mortgage before house hunting to understand your price range. Would you like more specific advice about the home buying process?";
  }
  else if (userInput.includes('tax') || userInput.includes('taxes')) {
    response = "To optimize your tax situation, fully utilize tax-advantaged accounts like 401(k)s, IRAs, and HSAs. Keep track of deductible expenses throughout the year. Consider tax-loss harvesting for investment accounts. If you're self-employed, track business expenses carefully and make quarterly estimated tax payments. For complex situations, a tax professional can often save you more than their fee. Would you like more specific tax optimization strategies?";
  }
  else if (userInput.includes('business') || userInput.includes('company') || userInput.includes('profit')) {
    response = "For business finances, it's crucial to separate personal and business expenses. Track all business expenses meticulously for tax purposes. Consider setting up a cash flow forecast to anticipate slow periods. For small businesses, setting aside 30% of income for taxes is a good rule of thumb. Regular financial reviews (monthly or quarterly) can help identify areas to cut costs or increase profitability. Would you like specific advice on business budgeting or expense tracking tools?";
  }
  else {
    response = "Thank you for your question. Financial planning is highly personal and depends on your specific goals, income, and life stage. To provide the most useful advice, I'd need to know more about your financial situation, including your income, expenses, debt, savings, and short/long-term goals. Would you like to share more details so I can offer more tailored recommendations?";
  }

  // Add real-time market data if relevant to the question
  if (insights && insights.length > 0 && 
      (userInput.includes('market') || userInput.includes('invest') || userInput.includes('stock') || userInput.includes('trend'))) {
    const relevantInsight = insights[Math.floor(Math.random() * insights.length)];
    response += `\n\n📈 *Based on current market data*: ${relevantInsight.title} - ${relevantInsight.description}\n\n${relevantInsight.recommendation}`;
  }

  return response;
};
