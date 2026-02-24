import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Lock, Globe, Moon, Sun, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import TwoFactorSetup from '@/components/settings/TwoFactorSetup';
import SessionManagement from '@/components/settings/SessionManagement';
import ActivityLog from '@/components/settings/ActivityLog';
import ChangePassword from '@/components/settings/ChangePassword';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ full_name: '' });
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      let currentUser = session?.user;

      if (!session) {
        const isTester = localStorage.getItem('isTester');
        if (isTester === 'true') {
          currentUser = JSON.parse(localStorage.getItem('testerUser') || '{}');
          setUser(currentUser);
        } else {
          navigate('/auth');
          return;
        }
      } else {
        setUser(session.user);
      }

      if (currentUser?.email === 'tester@gmail.com') {
        setProfile({ full_name: 'Tester User' });
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        setProfile({ full_name: data.full_name || '' });
      }
    };

    checkAuth();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (user.email === 'tester@gmail.com') {
      toast({
        title: "Profile updated (Mode Tester)",
        description: "Your local profile has been updated successfully.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: profile.full_name })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-montserrat bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-budgify-500/20 flex items-center justify-center">
                  <User size={32} className="text-budgify-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <Button onClick={handleUpdateProfile} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell size={24} className="text-budgify-400" />
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email updates about your finances</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Transaction Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified about large transactions</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Budget Reminders</p>
                    <p className="text-sm text-muted-foreground">Weekly budget status updates</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={24} className="text-budgify-400" />
                <h2 className="text-xl font-semibold">Security Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Ubah Password</h3>
                  <p className="text-sm text-muted-foreground mb-4">Perbarui password untuk menjaga keamanan akun Anda</p>
                  <ChangePassword />
                </div>

                <div className="pt-4 border-t">
                  <TwoFactorSetup />
                </div>
              </div>
            </div>

            <SessionManagement />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <History size={24} className="text-budgify-400" />
                <h2 className="text-xl font-semibold">Riwayat Aktivitas</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Pantau semua aktivitas yang terjadi di akun Anda untuk keamanan
              </p>
              <ActivityLog />
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={24} className="text-budgify-400" />
                <h2 className="text-xl font-semibold">App Preferences</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme</p>
                    </div>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select id="currency" className="w-full mt-2 bg-background border border-input rounded-md px-3 py-2">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
