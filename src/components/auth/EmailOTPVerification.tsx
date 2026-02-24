import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { motion } from 'framer-motion';

interface EmailOTPVerificationProps {
  email: string;
  type: 'signup' | 'magiclink';
  onSuccess: () => void;
  onCancel: () => void;
}

const EmailOTPVerification: React.FC<EmailOTPVerificationProps> = ({ 
  email, 
  type,
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: 'Kode Tidak Valid',
        description: 'Masukkan 6 digit kode dari email Anda',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: type === 'signup' ? 'signup' : 'magiclink',
      });

      if (error) throw error;

      if (data.session) {
        toast({
          title: 'Berhasil!',
          description: 'Email berhasil diverifikasi',
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Verifikasi Gagal',
        description: error.message || 'Kode tidak valid atau sudah expired',
        variant: 'destructive',
      });
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
        });
        if (error) throw error;
      }

      toast({
        title: 'Kode Terkirim!',
        description: 'Kode verifikasi baru telah dikirim ke email Anda',
      });
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: 'Gagal Mengirim',
        description: error.message || 'Gagal mengirim kode verifikasi',
        variant: 'destructive',
      });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  return (
    <Card className="w-full max-w-md glass-card animate-scale-in">
      <CardHeader className="space-y-3 sm:space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </motion.div>
        <CardTitle className="text-xl sm:text-2xl text-center">Verifikasi Email</CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          Masukkan kode 6 digit yang telah dikirim ke
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="text-center">
            {canResend ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:text-primary/80"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Kirim Ulang Kode
                  </>
                )}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Kirim ulang kode dalam <span className="font-medium text-foreground">{countdown}</span> detik
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              type="button"
              onClick={handleVerify}
              className="w-full" 
              disabled={loading || code.length !== 6}
            >
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
              Batal
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailOTPVerification;
