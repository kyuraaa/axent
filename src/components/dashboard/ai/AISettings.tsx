import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Shield, History, Trash2, Database, Brain, Bell, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
} from "@/components/ui/alert-dialog";

const AISettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    allowBudgetAccess: true,
    allowInvestmentAccess: true,
    allowCryptoAccess: true,
    allowBusinessAccess: false,
    enableSmartInsights: true,
    enableNotifications: true,
    saveHistory: true
  });

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    toast({
      title: 'Pengaturan Disimpan',
      description: 'Perubahan pengaturan berhasil disimpan'
    });
  };

  const handleClearHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('conversations')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: 'Riwayat Dihapus',
        description: 'Semua riwayat chat AI berhasil dihapus'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus riwayat',
        variant: 'destructive'
      });
    }
  };

  const usageStats = {
    chatUsage: 75,
    scanUsage: 30,
    insightUsage: 60,
    monthlyLimit: 1000,
    used: 450
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-muted-foreground">Kontrol data yang boleh diakses AI, history prompt, dan usage credits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Access */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Akses Data AI
            </CardTitle>
            <CardDescription>Pilih data mana yang boleh diakses oleh AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Data Budget & Transaksi</Label>
                  <p className="text-xs text-muted-foreground">Pemasukan, pengeluaran, kategori</p>
                </div>
              </div>
              <Switch 
                checked={settings.allowBudgetAccess}
                onCheckedChange={() => handleSettingChange('allowBudgetAccess')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Data Investasi</Label>
                  <p className="text-xs text-muted-foreground">Portfolio saham dan performa</p>
                </div>
              </div>
              <Switch 
                checked={settings.allowInvestmentAccess}
                onCheckedChange={() => handleSettingChange('allowInvestmentAccess')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Data Crypto</Label>
                  <p className="text-xs text-muted-foreground">Holdings dan nilai crypto</p>
                </div>
              </div>
              <Switch 
                checked={settings.allowCryptoAccess}
                onCheckedChange={() => handleSettingChange('allowCryptoAccess')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Data Bisnis</Label>
                  <p className="text-xs text-muted-foreground">Keuangan bisnis & invoice</p>
                </div>
              </div>
              <Switch 
                checked={settings.allowBusinessAccess}
                onCheckedChange={() => handleSettingChange('allowBusinessAccess')}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Features */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Fitur AI
            </CardTitle>
            <CardDescription>Aktifkan atau nonaktifkan fitur AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Smart Insights</Label>
                  <p className="text-xs text-muted-foreground">Analisis otomatis pengeluaran</p>
                </div>
              </div>
              <Switch 
                checked={settings.enableSmartInsights}
                onCheckedChange={() => handleSettingChange('enableSmartInsights')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Notifikasi AI</Label>
                  <p className="text-xs text-muted-foreground">Notifikasi insight & warning</p>
                </div>
              </div>
              <Switch 
                checked={settings.enableNotifications}
                onCheckedChange={() => handleSettingChange('enableNotifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label>Simpan Riwayat Chat</Label>
                  <p className="text-xs text-muted-foreground">Simpan percakapan dengan AI</p>
                </div>
              </div>
              <Switch 
                checked={settings.saveHistory}
                onCheckedChange={() => handleSettingChange('saveHistory')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Penggunaan AI</CardTitle>
          <CardDescription>Statistik penggunaan fitur AI bulan ini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Chat AI</span>
                <span className="text-sm font-medium">{usageStats.chatUsage}%</span>
              </div>
              <Progress value={usageStats.chatUsage} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Receipt Scan</span>
                <span className="text-sm font-medium">{usageStats.scanUsage}%</span>
              </div>
              <Progress value={usageStats.scanUsage} className="h-2" />
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Smart Insights</span>
                <span className="text-sm font-medium">{usageStats.insightUsage}%</span>
              </div>
              <Progress value={usageStats.insightUsage} className="h-2" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Total Penggunaan Bulan Ini</p>
                <p className="text-sm text-muted-foreground">
                  {usageStats.used} dari {usageStats.monthlyLimit} requests
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{((usageStats.used / usageStats.monthlyLimit) * 100).toFixed(0)}%</p>
              </div>
            </div>
            <Progress value={(usageStats.used / usageStats.monthlyLimit) * 100} className="h-2 mt-3" />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-500">Zona Berbahaya</CardTitle>
          <CardDescription>Tindakan yang tidak dapat dibatalkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">Hapus Semua Riwayat Chat</p>
                <p className="text-sm text-muted-foreground">Menghapus semua percakapan dengan AI</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Hapus Riwayat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Semua Riwayat?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua percakapan Anda dengan AI Financial Advisor secara permanen.
                    Tindakan ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-red-500 hover:bg-red-600">
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISettings;
