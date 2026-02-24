-- Add time column to budget_transactions table
ALTER TABLE public.budget_transactions 
ADD COLUMN IF NOT EXISTS time TIME DEFAULT '12:00:00';

-- Add comment
COMMENT ON COLUMN public.budget_transactions.time IS 'Time of the transaction, extracted from receipt or manually entered';