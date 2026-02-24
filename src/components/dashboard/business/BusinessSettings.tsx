import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Building2, Users, Globe, CreditCard, Bell, Shield, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  isDefault: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

const BusinessSettings = () => {
  const { toast } = useToast();
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([
    { id: '1', name: 'PT Maju Jaya', type: 'PT', currency: 'IDR', isDefault: true },
    { id: '2', name: 'CV Berkah Abadi', type: 'CV', currency: 'IDR', isDefault: false }
  ]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Viewer' }
  ]);

  const [newBusiness, setNewBusiness] = useState({ name: '', type: 'PT', currency: 'IDR' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Viewer' });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    weeklyReport: true,
    monthlyReport: true,
    lowBalanceAlert: true,
    invoiceReminder: true
  });

  const handleAddBusiness = () => {
    const business: Business = {
      id: String(Date.now()),
      name: newBusiness.name,
      type: newBusiness.type,
      currency: newBusiness.currency,
      isDefault: businesses.length === 0
    };
    setBusinesses([...businesses, business]);
    setIsBusinessDialogOpen(false);
    setNewBusiness({ name: '', type: 'PT', currency: 'IDR' });
    toast({ title: 'Berhasil', description: 'Bisnis berhasil ditambahkan' });
  };

  const handleDeleteBusiness = (id: string) => {
    setBusinesses(businesses.filter(b => b.id !== id));
    toast({ title: 'Berhasil', description: 'Bisnis berhasil dihapus' });
  };

  const handleSetDefault = (id: string) => {
    setBusinesses(businesses.map(b => ({ ...b, isDefault: b.id === id })));
    toast({ title: 'Berhasil', description: 'Bisnis default berhasil diubah' });
  };

  const handleAddMember = () => {
    const member: TeamMember = {
      id: String(Date.now()),
      ...newMember
    };
    setTeamMembers([...teamMembers, member]);
    setIsTeamDialogOpen(false);
    setNewMember({ name: '', email: '', role: 'Viewer' });
    toast({ title: 'Berhasil', description: 'Anggota tim berhasil ditambahkan' });
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    toast({ title: 'Berhasil', description: 'Anggota tim berhasil dihapus' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Business Settings</h1>
          <p className="text-muted-foreground">Pengaturan multi-business, mata uang, dan akses tim</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Business Management */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Daftar Bisnis
                </CardTitle>
                <CardDescription>Kelola multiple bisnis dalam satu akun</CardDescription>
              </div>
              <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Bisnis Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Nama Bisnis</Label>
                      <Input
                        value={newBusiness.name}
                        onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                        placeholder="PT ABC Indonesia"
                      />
                    </div>
                    <div>
                      <Label>Tipe Badan Usaha</Label>
                      <Select value={newBusiness.type} onValueChange={(v) => setNewBusiness({ ...newBusiness, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PT">PT (Perseroan Terbatas)</SelectItem>
                          <SelectItem value="CV">CV (Commanditaire Vennootschap)</SelectItem>
                          <SelectItem value="UD">UD (Usaha Dagang)</SelectItem>
                          <SelectItem value="Perorangan">Perorangan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mata Uang</Label>
                      <Select value={newBusiness.currency} onValueChange={(v) => setNewBusiness({ ...newBusiness, currency: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleAddBusiness}>Tambah Bisnis</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {businesses.map(business => (
              <div key={business.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{business.name}</p>
                    <p className="text-sm text-muted-foreground">{business.type} • {business.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {business.isDefault ? (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Default</span>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => handleSetDefault(business.id)}>Set Default</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteBusiness(business.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Akses Tim
                </CardTitle>
                <CardDescription>Kelola anggota tim dan akses mereka</CardDescription>
              </div>
              <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Undang
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Undang Anggota Tim</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Nama</Label>
                      <Input
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="email@company.com"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={newMember.role} onValueChange={(v) => setNewMember({ ...newMember, role: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Editor">Editor</SelectItem>
                          <SelectItem value="Viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleAddMember}>Kirim Undangan</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-medium text-primary">{member.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">{member.role}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveMember(member.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifikasi Bisnis
          </CardTitle>
          <CardDescription>Atur notifikasi untuk aktivitas bisnis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Notifikasi Email', desc: 'Terima notifikasi melalui email' },
            { key: 'weeklyReport', label: 'Laporan Mingguan', desc: 'Kirim ringkasan mingguan setiap Senin' },
            { key: 'monthlyReport', label: 'Laporan Bulanan', desc: 'Kirim laporan keuangan bulanan' },
            { key: 'lowBalanceAlert', label: 'Peringatan Saldo Rendah', desc: 'Notifikasi saat saldo di bawah threshold' },
            { key: 'invoiceReminder', label: 'Pengingat Invoice', desc: 'Ingatkan invoice yang belum dibayar' }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <Label>{item.label}</Label>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={settings[item.key as keyof typeof settings]}
                onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessSettings;
