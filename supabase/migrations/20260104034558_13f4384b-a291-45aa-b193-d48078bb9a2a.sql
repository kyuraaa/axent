-- Secure login_attempts table - block all direct client access
-- SECURITY DEFINER functions (check_rate_limit, record_login_attempt) will still work

-- Add restrictive policies that block all direct access
CREATE POLICY "No direct select access" 
ON public.login_attempts 
FOR SELECT 
USING (false);

CREATE POLICY "No direct insert access" 
ON public.login_attempts 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "No direct update access" 
ON public.login_attempts 
FOR UPDATE 
USING (false);

CREATE POLICY "No direct delete access" 
ON public.login_attempts 
FOR DELETE 
USING (false);