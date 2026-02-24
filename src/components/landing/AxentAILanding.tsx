"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

export default function AxentAILanding() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, []);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    if (!isAuthenticated) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menggunakan Axent AI",
      });
      navigate("/auth");
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-command-executor', {
        body: { message: message.trim() }
      });

      if (error) throw error;

      setResult({
        success: data?.executed ?? false,
        message: data?.response || 'Perintah berhasil diproses'
      });

      if (data?.executed) {
        toast({
          title: "Berhasil",
          description: data.response,
        });
      }

    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        message: 'Terjadi kesalahan. Silakan coba lagi.'
      });
      toast({
        title: "Error",
        description: "Gagal memproses perintah",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-background min-h-[70vh] py-14 md:py-16">
      <div className="container mx-auto px-3 relative z-10">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          {/* Result Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-xl mb-5"
              >
                <div className={`rounded-xl p-4 backdrop-blur-xl border ${
                  result.success 
                    ? "bg-emerald-500/10 border-emerald-500/20" 
                    : "bg-white/5 border-white/10"
                }`}>
                  <div className="flex items-start gap-2">
                    {result.success && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />}
                    <TextGenerateEffect 
                      words={result.message}
                      className="text-xs text-white/80"
                      duration={0.3}
                      filter={false}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated AI Chat */}
          <AnimatedAIChat
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            title="Axent AI"
            subtitle="Kelola keuangan dengan perintah natural — cukup ketik dan biarkan AI bekerja"
            placeholder="Ketik perintah... contoh: 'Tambah pemasukan gaji 10 juta'"
            showBackground={false}
          />

          {/* CTA to Dashboard */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors font-medium"
            >
              <span>{isAuthenticated ? "Buka Dashboard Lengkap" : "Mulai Sekarang"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
