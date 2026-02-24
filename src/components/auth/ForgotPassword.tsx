import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const emailSchema = z.string().trim().email({ message: "Email tidak valid" }).max(255, { message: "Email terlalu panjang" });

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0].message);
      }
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'Email Terkirim!',
        description: 'Cek inbox email Anda untuk link reset password',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengirim email reset password',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md glass-card animate-scale-in">
      <CardHeader className="space-y-3 sm:space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mb-2 w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs sm:text-sm font-medium">Kembali ke Login</span>
        </button>
        <div className="flex justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
          >
            {emailSent ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </motion.div>
        </div>
        <CardTitle className="text-xl sm:text-2xl text-center">
          {emailSent ? 'Email Terkirim!' : 'Lupa Password?'}
        </CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">
          {emailSent 
            ? 'Kami telah mengirim link untuk reset password ke email Anda' 
            : 'Masukkan email Anda untuk menerima link reset password'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {emailSent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                <p>Cek folder inbox dan spam email Anda.</p>
                <p className="mt-2">Link akan expired dalam 24 jam.</p>
              </div>
              <Button 
                onClick={onBack} 
                className="w-full"
                variant="outline"
              >
                Kembali ke Login
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  'Kirim Link Reset'
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default ForgotPassword;
