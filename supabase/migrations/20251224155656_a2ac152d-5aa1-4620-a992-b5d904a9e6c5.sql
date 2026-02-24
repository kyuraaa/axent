-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view their login attempts" ON public.login_attempts;

-- Create a restrictive policy that only allows users to see their own login attempts
CREATE POLICY "Users can view only their own login attempts"
ON public.login_attempts
FOR SELECT
USING (auth.jwt() ->> 'email' = email);