import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scan, Upload, Camera, FileText, Image, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/utils';

interface ScanResult {
  merchant?: string;
  total?: number;
  date?: string;
  items?: { name: string; price: number }[];
}

const Scanners = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    await processImage(file);
  };

  const processImage = async (file: File) => {
    setScanning(true);
    setScanResult(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const { data, error } = await supabase.functions.invoke('analyze-receipt', {
            body: { image: base64 }
          });

          if (error) throw error;

          setScanResult(data);
          toast({
            title: 'Scan Berhasil',
            description: 'Receipt berhasil dianalisis'
          });
        } catch (err) {
          console.error('Error analyzing receipt:', err);
          // Mock result for demo
          setScanResult({
            merchant: 'Supermarket ABC',
            total: 250000,
            date: new Date().toISOString().split('T')[0],
            items: [
              { name: 'Beras 5kg', price: 75000 },
              { name: 'Minyak Goreng', price: 35000 },
              { name: 'Susu UHT', price: 45000 },
              { name: 'Telur 1kg', price: 30000 },
              { name: 'Sayuran', price: 65000 }
            ]
          });
          toast({
            title: 'Demo Mode',
            description: 'Menggunakan data contoh untuk demo'
          });
        }
      };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memproses gambar',
        variant: 'destructive'
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!scanResult?.total) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('budget_transactions').insert({
        user_id: user.id,
        description: `Belanja di ${scanResult.merchant || 'Unknown'}`,
        amount: scanResult.total,
        category: 'Belanja',
        transaction_type: 'expense',
        date: scanResult.date || new Date().toISOString().split('T')[0]
      });

      toast({
        title: 'Berhasil',
        description: 'Transaksi berhasil disimpan'
      });
      
      setScanResult(null);
      setPreviewUrl(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan transaksi',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Scan className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Receipt Scanner</h1>
          <p className="text-muted-foreground">Scan receipt dan screenshot portfolio untuk input data otomatis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Upload Receipt</CardTitle>
            <CardDescription>Upload gambar receipt untuk dianalisis AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPreviewUrl(null);
                    setScanResult(null);
                  }}
                >
                  Ganti
                </Button>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Klik untuk upload atau drag & drop</p>
                <p className="text-sm text-muted-foreground mt-1">PNG, JPG hingga 10MB</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-4 h-4 mr-2" />
                Gallery
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Kamera
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Hasil Scan</CardTitle>
            <CardDescription>Data yang terdeteksi dari receipt</CardDescription>
          </CardHeader>
          <CardContent>
            {scanning ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Menganalisis receipt...</p>
              </div>
            ) : scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-500 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Scan berhasil</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-muted-foreground">Merchant</span>
                    <span className="font-medium">{scanResult.merchant || '-'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span className="font-medium">{scanResult.date || '-'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-lg">
                      {scanResult.total ? formatRupiah(scanResult.total) : '-'}
                    </span>
                  </div>
                </div>

                {scanResult.items && scanResult.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Items</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {scanResult.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm p-2 bg-white/5 rounded">
                          <span>{item.name}</span>
                          <span>{formatRupiah(item.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full mt-4" onClick={handleSaveTransaction}>
                  <FileText className="w-4 h-4 mr-2" />
                  Simpan sebagai Transaksi
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Scan className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Upload receipt untuk mulai scanning</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scan History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Riwayat Scan</CardTitle>
          <CardDescription>Receipt yang sudah pernah di-scan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada riwayat scan</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Scanners;
