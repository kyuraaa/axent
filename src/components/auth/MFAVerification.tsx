import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MFAVerificationProps {
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ factorId, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast({
        title: 'Kode Tidak Valid',
        description: 'Masukkan 6 digit kode dari authenticator Anda',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) throw verifyError;

      toast({
        title: 'Berhasil!',
        description: 'Verifikasi berhasil',
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Verifikasi Gagal',
        description: error.message || 'Kode tidak valid. Silakan coba lagi.',
        variant: 'destructive',
      });
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card animate-scale-in">
      <CardHeader className="space-y-3 sm:space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-xl sm:text-2xl text-center">Verifikasi 2FA</CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Masukkan kode 6 digit dari aplikasi authenticator Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Kode Verifikasi</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                'Verifikasi'
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={onCancel}
              disabled={loading}
            >
              Kembali ke Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MFAVerification;
