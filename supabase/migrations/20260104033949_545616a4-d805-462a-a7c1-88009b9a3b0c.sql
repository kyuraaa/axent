-- Fix login_attempts table - remove all public access, only allow server-side operations
-- First drop existing policies
DROP POLICY IF EXISTS "Anyone can view login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow public to view login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow public to insert login attempts" ON public.login_attempts;

-- No SELECT policy - only the SECURITY DEFINER functions can access
-- No INSERT policy - only the record_login_attempt function can insert

-- Fix activity_logs table - prevent users from deleting their own logs to maintain audit integrity
CREATE POLICY "Users cannot delete activity logs" 
ON public.activity_logs 
FOR DELETE 
USING (false);