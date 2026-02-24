import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Plus, Send, CheckCircle, Clock, AlertCircle, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string;
  items: unknown;
  notes: string | null;
}

const parseInvoices = (data: any[]): Invoice[] => {
  return data.map(inv => ({
    ...inv,
    items: Array.isArray(inv.items) ? inv.items : []
  }));
};

const InvoiceManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newInvoice, setNewInvoice] = useState({
    clientName: '',
    clientEmail: '',
    description: '',
    quantity: 1,
    price: ''
  });

  useEffect(() => {
    fetchInvoices();
    
    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(parseInvoices(data || []));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({ title: 'Error', description: 'Gagal memuat data invoice', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500/20 text-green-500">Lunas</Badge>;
      case 'sent': return <Badge className="bg-blue-500/20 text-blue-500">Terkirim</Badge>;
      case 'overdue': return <Badge className="bg-red-500/20 text-red-500">Jatuh Tempo</Badge>;
      default: return <Badge className="bg-gray-500/20 text-gray-500">Draft</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'sent': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName || !newInvoice.price) {
      toast({ title: 'Error', description: 'Silakan lengkapi field yang diperlukan', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error } = await supabase.from('invoices').insert({
        user_id: user.id,
        invoice_number: invoiceNumber,
        client_name: newInvoice.clientName,
        client_email: newInvoice.clientEmail || null,
        amount: parseFloat(newInvoice.price) * newInvoice.quantity,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        items: [{ description: newInvoice.description, quantity: newInvoice.quantity, price: parseFloat(newInvoice.price) }],
        notes: null
      });

      if (error) throw error;

      toast({ title: 'Invoice Dibuat', description: `Invoice ${invoiceNumber} berhasil dibuat` });
      setIsDialogOpen(false);
      setNewInvoice({ clientName: '', clientEmail: '', description: '', quantity: 1, price: '' });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Error', description: 'Gagal membuat invoice', variant: 'destructive' });
    }
  };

  const handleSendInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').update({ status: 'sent' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Invoice Terkirim', description: 'Invoice berhasil dikirim ke email klien' });
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast({ title: 'Error', description: 'Gagal mengirim invoice', variant: 'destructive' });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Status Diperbarui', description: 'Invoice ditandai sebagai lunas' });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({ title: 'Error', description: 'Gagal memperbarui status', variant: 'destructive' });
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Invoice berhasil dihapus' });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({ title: 'Error', description: 'Gagal menghapus invoice', variant: 'destructive' });
    }
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Invoice Manager</h1>
            <p className="text-muted-foreground">Buat, kirim, dan kelola invoice untuk klien Anda</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Buat Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Buat Invoice Baru</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nama Klien</Label>
                <Input value={newInvoice.clientName} onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })} placeholder="PT ABC Indonesia" />
              </div>
              <div>
                <Label>Email Klien</Label>
                <Input type="email" value={newInvoice.clientEmail} onChange={(e) => setNewInvoice({ ...newInvoice, clientEmail: e.target.value })} placeholder="finance@abc.co.id" />
              </div>
              <div>
                <Label>Deskripsi Layanan</Label>
                <Textarea value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} placeholder="Consulting Services" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={newInvoice.quantity} onChange={(e) => setNewInvoice({ ...newInvoice, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <Label>Harga</Label>
                  <Input type="number" value={newInvoice.price} onChange={(e) => setNewInvoice({ ...newInvoice, price: e.target.value })} placeholder="0" />
                </div>
              </div>
              <Button className="w-full" onClick={handleCreateInvoice}>Buat Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Invoice</p>
            <p className="text-2xl font-bold mt-1">{formatRupiah(stats.total)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
            <p className="text-2xl font-bold mt-1 text-green-500">{formatRupiah(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Menunggu Pembayaran</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{formatRupiah(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Jatuh Tempo</p>
            <p className="text-2xl font-bold mt-1 text-red-500">{formatRupiah(stats.overdue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Daftar Invoice</CardTitle>
          <CardDescription>{invoices.length} invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoice_number}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{invoice.client_name} • Due: {invoice.due_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">{formatRupiah(invoice.amount)}</p>
                  <div className="flex gap-2">
                    {invoice.status === 'draft' && (
                      <Button size="sm" onClick={() => handleSendInvoice(invoice.id)}><Send className="w-4 h-4 mr-1" />Kirim</Button>
                    )}
                    {invoice.status === 'sent' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(invoice.id)}><CheckCircle className="w-4 h-4 mr-1" />Tandai Lunas</Button>
                    )}
                    <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteInvoice(invoice.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            ))}

            {invoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">Belum ada invoice</h3>
                <p className="text-muted-foreground mb-4">Buat invoice pertama Anda</p>
                <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Buat Invoice</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceManager;
