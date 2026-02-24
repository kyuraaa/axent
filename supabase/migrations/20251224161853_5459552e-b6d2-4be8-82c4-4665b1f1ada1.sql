-- Fix login_attempts table security
-- Problem: Current policies allow email harvesting attacks

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Users can view only their own login attempts" ON public.login_attempts;

-- The login_attempts table should only be accessed by:
-- 1. The check_rate_limit function (SECURITY DEFINER - already bypasses RLS)
-- 2. Server-side operations via service role

-- No direct client access should be allowed
-- The check_rate_limit function handles all necessary access
-- This prevents email harvesting attacks since:
-- - Users cannot INSERT directly (prevents fake attempt injection)
-- - Users cannot SELECT to confirm email existence

-- Note: The table already has RLS enabled, we just removed all policies
-- This means NO client can read or write directly - only SECURITY DEFINER functions can access it