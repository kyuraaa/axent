-- Create a SECURITY DEFINER function to record login attempts
-- This allows the app to record attempts without direct table access

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (p_email, p_success, p_ip_address);
END;
$$;

-- Grant execute to anon and authenticated (needed for login flow)
GRANT EXECUTE ON FUNCTION public.record_login_attempt TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt TO authenticated;