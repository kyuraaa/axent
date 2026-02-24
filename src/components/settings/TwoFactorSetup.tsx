import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Loader2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logActivity } from '@/lib/activityLogger';

const TwoFactorSetup = () => {
  const { toast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = data?.totp || [];
      const verifiedFactor = totpFactors.find(f => f.status === 'verified');
      setIs2FAEnabled(!!verifiedFactor);
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      }
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      await startEnrollment();
    } else {
      setShowDisableDialog(true);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      // First, unenroll any unverified factors
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = factors?.totp?.filter(f => f.status !== 'verified') || [];
      
      for (const factor of unverifiedFactors) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // Enroll new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setShowSetupDialog(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memulai pengaturan 2FA',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) return;

    setVerifying(true);
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
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setIs2FAEnabled(true);
      setShowSetupDialog(false);
      setVerificationCode('');
      setQrCode(null);
      setSecret(null);

      // Log activity
      await logActivity({ action: 'mfa_enabled' });

      toast({
        title: 'Berhasil!',
        description: 'Two-Factor Authentication berhasil diaktifkan',
      });
    } catch (error: any) {
      toast({
        title: 'Verifikasi Gagal',
        description: error.message || 'Kode tidak valid. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!factorId || !disableCode) return;

    setDisabling(true);
    try {
      // Create a challenge first
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // Verify before unenrolling
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: disableCode
      });

      if (verifyError) throw verifyError;

      // Unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId
      });

      if (unenrollError) throw unenrollError;

      setIs2FAEnabled(false);
      setFactorId(null);
      setShowDisableDialog(false);
      setDisableCode('');

      // Log activity
      await logActivity({ action: 'mfa_disabled' });

      toast({
        title: 'Berhasil!',
        description: 'Two-Factor Authentication berhasil dinonaktifkan',
      });
    } catch (error: any) {
      toast({
        title: 'Gagal Menonaktifkan',
        description: error.message || 'Kode tidak valid. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Disalin!',
        description: 'Kode rahasia telah disalin ke clipboard',
      });
    }
  };

  const cancelSetup = async () => {
    // Unenroll if we have an unverified factor
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch (e) {
        // Ignore errors when canceling
      }
    }
    setShowSetupDialog(false);
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setVerificationCode('');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Memuat status 2FA...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {is2FAEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">
              {is2FAEnabled 
                ? 'Akun Anda dilindungi dengan 2FA' 
                : 'Tambahkan lapisan keamanan ekstra'}
            </p>
          </div>
        </div>
        <Switch 
          checked={is2FAEnabled} 
          onCheckedChange={handleToggle2FA}
          disabled={enrolling}
        />
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(open) => !open && cancelSetup()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Aktifkan Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan QR code berikut dengan aplikasi authenticator Anda (Google Authenticator, Authy, dll)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Manual Entry Secret */}
            {secret && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Atau masukkan kode ini secara manual:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copySecret}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="verification-code">Kode Verifikasi</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Masukkan 6 digit kode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={cancelSetup}
              >
                Batal
              </Button>
              <Button 
                className="flex-1"
                onClick={verifyAndEnable}
                disabled={verificationCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Aktifkan 2FA'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Nonaktifkan Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Untuk menonaktifkan 2FA, masukkan kode dari aplikasi authenticator Anda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-code">Kode Verifikasi</Label>
              <Input
                id="disable-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Masukkan 6 digit kode"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisableCode('');
                }}
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={disable2FA}
                disabled={disableCode.length !== 6 || disabling}
              >
                {disabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Nonaktifkan 2FA'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TwoFactorSetup;
