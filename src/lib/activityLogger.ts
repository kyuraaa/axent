import { supabase } from '@/integrations/supabase/client';

export type ActivityAction = 
  | 'login'
  | 'logout'
  | 'signup'
  | 'settings_update'
  | 'profile_update'
  | 'mfa_enabled'
  | 'mfa_disabled'
  | 'transaction_added'
  | 'transaction_deleted'
  | 'investment_added'
  | 'investment_deleted'
  | 'crypto_added'
  | 'crypto_deleted'
  | 'password_changed';

interface LogActivityParams {
  action: ActivityAction;
  details?: Record<string, any>;
}

export const logActivity = async ({ action, details }: LogActivityParams): Promise<void> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('activity_logs').insert({
      user_id: session.user.id,
      action,
      details: details || null,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const checkRateLimit = async (email: string): Promise<{ allowed: boolean; remainingAttempts: number }> => {
  try {
    // Use SECURITY DEFINER function to check rate limit securely
    // This prevents direct table access and email enumeration attacks
    const { data, error } = await supabase.rpc('check_rate_limit', {
      check_email: email,
      check_ip: '', // IP not available client-side, pass empty string
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail secure - deny access on errors
      return { allowed: false, remainingAttempts: 0 };
    }

    // The function returns boolean (true = allowed)
    return {
      allowed: data === true,
      remainingAttempts: data === true ? 5 : 0,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail secure - deny access on errors
    return { allowed: false, remainingAttempts: 0 };
  }
};

export const recordLoginAttempt = async (email: string, success: boolean): Promise<void> => {
  try {
    // Use SECURITY DEFINER function instead of direct insert
    // This prevents email enumeration attacks via RLS bypass
    const { error } = await supabase.rpc('record_login_attempt', {
      p_email: email,
      p_success: success,
      p_ip_address: null,
    });
    
    if (error) {
      console.error('Failed to record login attempt:', error);
    }
  } catch (error) {
    console.error('Failed to record login attempt:', error);
  }
};
