import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Shield, LogIn, LogOut, Settings, CreditCard, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLogEntry {
  id: string;
  action: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const ActivityLog: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal memuat log aktivitas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'signin':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'logout':
      case 'signout':
        return <LogOut className="h-4 w-4 text-white/70" />;
      case 'settings_update':
      case 'profile_update':
        return <Settings className="h-4 w-4 text-emerald-500" />;
      case 'mfa_enabled':
      case 'mfa_disabled':
      case '2fa_enabled':
      case '2fa_disabled':
        return <Shield className="h-4 w-4 text-green-400" />;
      case 'transaction_added':
      case 'transaction_deleted':
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'investment_added':
      case 'investment_deleted':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'crypto_added':
      case 'crypto_deleted':
        return <Wallet className="h-4 w-4 text-emerald-400" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'login': 'Login ke akun',
      'signin': 'Masuk ke akun',
      'logout': 'Logout dari akun',
      'signout': 'Keluar dari akun',
      'settings_update': 'Memperbarui pengaturan',
      'profile_update': 'Memperbarui profil',
      'mfa_enabled': 'Mengaktifkan 2FA',
      'mfa_disabled': 'Menonaktifkan 2FA',
      '2fa_enabled': 'Mengaktifkan 2FA',
      '2fa_disabled': 'Menonaktifkan 2FA',
      'transaction_added': 'Menambah transaksi',
      'transaction_deleted': 'Menghapus transaksi',
      'investment_added': 'Menambah investasi',
      'investment_deleted': 'Menghapus investasi',
      'crypto_added': 'Menambah crypto',
      'crypto_deleted': 'Menghapus crypto',
      'password_changed': 'Mengubah password',
    };
    return labels[action.toLowerCase()] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleString('id-ID', {
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
            <CardTitle className="text-lg">Log Aktivitas</CardTitle>
            <CardDescription>Riwayat aktivitas akun Anda</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada aktivitas tercatat
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {getActionLabel(log.action)}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityLog;