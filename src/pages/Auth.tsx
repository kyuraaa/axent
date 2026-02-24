import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeftIcon, AlertTriangle, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import MFAVerification from '@/components/auth/MFAVerification';
import ForgotPassword from '@/components/auth/ForgotPassword';
import EmailOTPVerification from '@/components/auth/EmailOTPVerification';
import ResetPassword from '@/components/auth/ResetPassword';
import { logActivity, checkRateLimit, recordLoginAttempt } from '@/lib/activityLogger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FloatingPaths } from '@/components/ui/floating-paths';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }).max(255, { message: "Email terlalu panjang" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }).max(100, { message: "Password terlalu panjang" }),
  fullName: z.string().trim().min(1, { message: "Nama tidak boleh kosong" }).max(100, { message: "Nama terlalu panjang" }).optional(),
});

type AuthView = 'main' | 'forgot-password' | 'email-otp' | 'reset-password' | 'mfa';
type AuthMode = 'signin' | 'signup';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentView, setCurrentView] = useState<AuthView>('main');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [otpType, setOtpType] = useState<'signup' | 'magiclink'>('signup');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setCurrentView('reset-password');
    }
  }, [searchParams]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (currentView !== 'main') {
        return;
      }

      if (session) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];

        if (verifiedFactors.length > 0) {
          await supabase.auth.signOut();
          return;
        }

        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate, currentView]);

  const validateForm = (data: { email: string; password: string; fullName?: string }, isSignup: boolean) => {
    try {
      const schema = isSignup
        ? authSchema
        : authSchema.omit({ fullName: true });

      schema.parse(data);
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm({ email, password, fullName }, true)) {
      toast({
        title: 'Validasi Gagal',
        description: 'Mohon periksa kembali input Anda',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim(),
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: 'Email Sudah Terdaftar',
            description: 'Email ini sudah digunakan. Silakan login.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return;
      }

      if (data.user) {
        await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
        });

        setOtpType('signup');
        setCurrentView('email-otp');
        toast({
          title: 'Verifikasi Email',
          description: 'Kode verifikasi telah dikirim ke email Anda',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal membuat akun',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);

    if (!validateForm({ email, password }, false)) {
      toast({
        title: 'Validasi Gagal',
        description: 'Mohon periksa kembali input Anda',
        variant: 'destructive',
      });
      return;
    }

    const { allowed, remainingAttempts } = await checkRateLimit(email.trim());
    if (!allowed) {
      setRateLimitError('Terlalu banyak percobaan login. Silakan tunggu 15 menit sebelum mencoba lagi.');
      toast({
        title: 'Akses Diblokir',
        description: 'Terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Hardcoded tester account login logic
      if (email.trim().toLowerCase() === 'tester@gmail.com' && password === 'tester123*') {
        // Save tester session to localStorage
        localStorage.setItem('isTester', 'true');
        localStorage.setItem('testerUser', JSON.stringify({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'tester@gmail.com',
          user_metadata: { full_name: 'Tester' },
          created_at: new Date().toISOString()
        }));

        toast({
          title: 'Berhasil (Mode Tester)!',
          description: 'Login berhasil dengan akun tester',
        });
        navigate('/dashboard');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        await recordLoginAttempt(email.trim(), false);

        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: 'Login Gagal',
            description: `Email atau password salah. Sisa percobaan: ${remainingAttempts - 1}`,
            variant: 'destructive',
          });
        } else if (error.message.includes('Email not confirmed')) {
          setOtpType('signup');
          setCurrentView('email-otp');

          await supabase.auth.resend({
            type: 'signup',
            email: email.trim(),
          });

          toast({
            title: 'Email Belum Diverifikasi',
            description: 'Kode verifikasi baru telah dikirim ke email Anda',
          });
        } else {
          throw error;
        }
        return;
      }

      await recordLoginAttempt(email.trim(), true);

      if (data.session) {
        await logActivity({ action: 'login' });

        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];

        if (verifiedFactors.length > 0) {
          setMfaFactorId(verifiedFactors[0].id);
          setCurrentView('mfa');
          return;
        }

        toast({
          title: 'Berhasil!',
          description: 'Login berhasil',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal login',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = () => {
    toast({
      title: 'Berhasil!',
      description: 'Login berhasil',
    });
    navigate('/dashboard');
  };

  const handleMFACancel = async () => {
    await supabase.auth.signOut();
    setCurrentView('main');
    setMfaFactorId(null);
  };

  const handleEmailOTPSuccess = () => {
    toast({
      title: 'Berhasil!',
      description: 'Email berhasil diverifikasi',
    });
    navigate('/dashboard');
  };

  const handleEmailOTPCancel = () => {
    setCurrentView('main');
  };

  const handleResetPasswordSuccess = async () => {
    await supabase.auth.signOut();
    setCurrentView('main');
    navigate('/auth', { replace: true });
  };

  // Render special views
  if (currentView === 'mfa' && mfaFactorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in font-space-grotesk">
        <MFAVerification
          factorId={mfaFactorId}
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
        />
      </div>
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in font-space-grotesk">
        <ForgotPassword onBack={() => setCurrentView('main')} />
      </div>
    );
  }

  if (currentView === 'email-otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in font-space-grotesk">
        <EmailOTPVerification
          email={email}
          type={otpType}
          onSuccess={handleEmailOTPSuccess}
          onCancel={handleEmailOTPCancel}
        />
      </div>
    );
  }

  if (currentView === 'reset-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in font-space-grotesk">
        <ResetPassword onSuccess={handleResetPasswordSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-space-grotesk bg-background">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-budgify-900/20 via-background to-budgify-800/10">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />

        {/* Logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <img src={axentLogo} alt="Axent" className="h-24 w-auto" />
        </div>

        {/* Testimonial Quote */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-2xl border border-white/10"
          >
            <p className="text-white/80 text-lg leading-relaxed mb-4 italic">
              &ldquo;Beware of little expenses, a small leak will sink a great ship.&rdquo;
            </p>
            <p className="text-budgify-400 font-medium tracking-wide">
              &mdash; Benjamin Franklin
            </p>
          </motion.div>
        </div>

        {/* Decorative Dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-3 gap-4 opacity-20">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-budgify-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Mobile decorative elements */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-budgify-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-budgify-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Beranda</span>
          </Link>
        </motion.div>

        {/* Auth Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8"
          >
            {/* Logo for mobile */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <img src={axentLogo} alt="Axent" className="h-24 w-auto" />
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold text-white"
              >
                {authMode === 'signin' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/60"
              >
                {authMode === 'signin'
                  ? 'Masuk untuk mengakses dashboard Anda'
                  : 'Daftar untuk memulai perjalanan finansial Anda'}
              </motion.p>
            </div>

            {/* Auth Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex p-1 bg-white/5 rounded-xl border border-white/10"
            >
              <button
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${authMode === 'signin'
                  ? 'bg-budgify-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
                  }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${authMode === 'signup'
                  ? 'bg-budgify-500 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
                  }`}
              >
                Daftar
              </button>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp}
              className="space-y-4"
            >
              {rateLimitError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{rateLimitError}</AlertDescription>
                </Alert>
              )}

              {authMode === 'signup' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      className="pl-10 h-12 bg-white/5 border-white/10 focus:border-budgify-500 text-white placeholder:text-white/40"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  {validationErrors.fullName && (
                    <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 h-12 bg-white/5 border-white/10 focus:border-budgify-500 text-white placeholder:text-white/40"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                </div>
                {validationErrors.email && (
                  <p className="text-sm text-destructive">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={authMode === 'signup' ? 'Password (minimal 6 karakter)' : 'Password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 pr-10 h-12 bg-white/5 border-white/10 focus:border-budgify-500 text-white placeholder:text-white/40"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-destructive">{validationErrors.password}</p>
                )}
              </div>

              {authMode === 'signin' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setCurrentView('forgot-password')}
                    className="text-sm text-budgify-400 hover:text-budgify-300 transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-budgify-600 to-budgify-500 hover:from-budgify-500 hover:to-budgify-400 text-white font-medium"
                disabled={loading || !!rateLimitError}
              >
                {loading ? 'Memproses...' : authMode === 'signin' ? 'Masuk' : 'Daftar'}
              </Button>
            </motion.form>

            {/* Terms */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-xs text-white/40"
            >
              Dengan melanjutkan, Anda menyetujui{' '}
              <Link to="/terms" className="text-budgify-400 hover:underline">
                Ketentuan Layanan
              </Link>{' '}
              dan{' '}
              <Link to="/privacy" className="text-budgify-400 hover:underline">
                Kebijakan Privasi
              </Link>
              .
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
