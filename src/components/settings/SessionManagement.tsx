import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Monitor, LogOut, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  last_active: string;
  created_at: string;
  is_current: boolean;
}

// Hash function using Web Crypto API
const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const SessionManagement: React.FC = () => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal memuat sesi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    registerCurrentSession();
  }, []);

  const registerCurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const deviceInfo = getDeviceInfo();
      const hashedToken = await hashToken(session.access_token);
      
      // Check if current session exists using hashed token
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_token', hashedToken)
        .single();

      if (!existingSession) {
        // Create new session record with hashed token
        await supabase.from('user_sessions').insert({
          user_id: session.user.id,
          session_token: hashedToken,
          device_info: deviceInfo,
          is_current: true,
        });
      } else {
        // Update last active
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString(), is_current: true })
          .eq('id', existingSession.id);
      }

      // Mark other sessions as not current
      await supabase
        .from('user_sessions')
        .update({ is_current: false })
        .eq('user_id', session.user.id)
        .neq('session_token', hashedToken);

      fetchSessions();
    } catch (error) {
      console.error('Error registering session:', error);
    }
  };

  const getDeviceInfo = (): string => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) {
      if (/android/i.test(ua)) return 'Android Mobile';
      if (/iphone|ipad/i.test(ua)) return 'iPhone/iPad';
      return 'Mobile Device';
    }
    if (/windows/i.test(ua)) return 'Windows PC';
    if (/mac/i.test(ua)) return 'MacOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Unknown Device';
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Sesi telah dikeluarkan',
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete all sessions except current
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('is_current', false);

      if (error) throw error;

      // Sign out from Supabase (this will invalidate all tokens)
      await supabase.auth.signOut({ scope: 'global' });

      toast({
        title: 'Berhasil',
        description: 'Semua perangkat telah dikeluarkan',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sesi Aktif</CardTitle>
            <CardDescription>Kelola perangkat yang login ke akun Anda</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Tidak ada sesi aktif</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  session.is_current ? 'border-primary/50 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  {session.device_info?.toLowerCase().includes('mobile') ||
                  session.device_info?.toLowerCase().includes('android') ||
                  session.device_info?.toLowerCase().includes('iphone') ? (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {session.device_info || 'Unknown Device'}
                      {session.is_current && (
                        <span className="ml-2 text-xs text-primary">(Sesi ini)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aktif terakhir: {formatDate(session.last_active)}
                    </p>
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLogoutSession(session.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={loggingOut}>
                {loggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout dari Semua Perangkat
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout dari Semua Perangkat?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini akan mengeluarkan akun Anda dari semua perangkat termasuk perangkat ini.
                  Anda perlu login kembali di semua perangkat.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogoutAllDevices}>
                  Ya, Logout Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionManagement;
