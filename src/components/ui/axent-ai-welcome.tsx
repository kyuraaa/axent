"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  PieChart,
  Wallet,
  Bitcoin,
  Target,
  DollarSign,
  ArrowUpIcon,
  Paperclip,
  CircleUserRound,
  BarChart3,
  Receipt,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface AxentAIWelcomeProps {
  onSendMessage: (message: string) => void;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export default function AxentAIWelcome({ onSendMessage, inputValue, onInputChange }: AxentAIWelcomeProps) {
  const [localMessage, setLocalMessage] = useState("");
  const message = inputValue !== undefined ? inputValue : localMessage;
  const setMessage = onInputChange || setLocalMessage;
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  const commandSuggestions: { icon: React.ReactNode; label: string; prompt: string }[] = [
    { icon: <DollarSign className="w-4 h-4" />, label: "Catat Pemasukan", prompt: "Tambah pemasukan gaji bulan ini sebesar Rp 10.000.000" },
    { icon: <Wallet className="w-4 h-4" />, label: "Catat Pengeluaran", prompt: "Catat pengeluaran makan siang Rp 50.000" },
    { icon: <TrendingUp className="w-4 h-4" />, label: "Tambah Investasi", prompt: "Investasi saham BBCA sebesar Rp 5.000.000" },
    { icon: <Bitcoin className="w-4 h-4" />, label: "Beli Crypto", prompt: "Beli 0.01 Bitcoin dengan harga Rp 800.000.000 per BTC" },
    { icon: <Target className="w-4 h-4" />, label: "Set Target", prompt: "Set target nabung Rp 50.000.000 untuk liburan" },
    { icon: <PieChart className="w-4 h-4" />, label: "Ringkasan Keuangan", prompt: "Berapa total keuangan saya saat ini?" },
    { icon: <BarChart3 className="w-4 h-4" />, label: "Analisis Portfolio", prompt: "Bagaimana performa portfolio investasi saya?" },
    { icon: <Receipt className="w-4 h-4" />, label: "Laporan Bulanan", prompt: "Tampilkan ringkasan keuangan bulan ini" },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      adjustHeight(true);
    }
  };

  const selectCommandSuggestion = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-[600px] flex flex-col w-full items-center justify-center bg-transparent text-foreground p-6 relative overflow-hidden">
      {/* Centered AI Title */}
      <motion.div 
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Axent AI
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">
          Asisten keuangan pribadi Anda — mulai ketik di bawah.
        </p>
      </motion.div>

      {/* Input Box Section */}
      <motion.div 
        className="w-full max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan atau perintah keuangan..."
            className={cn(
              "w-full px-5 py-4 resize-none border-none",
              "bg-transparent text-foreground text-sm md:text-base",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none",
              "placeholder:text-muted-foreground/50 min-h-[48px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/5">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Tekan Enter untuk kirim
              </span>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
                  message.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only">Kirim</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          className="flex items-center justify-center flex-wrap gap-2 mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
        {commandSuggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Button
                variant="outline"
                onClick={() => selectCommandSuggestion(suggestion.prompt)}
                className="flex items-center gap-2 rounded-full border-border/50 bg-card/30 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-card/60 hover:border-primary/30 transition-all"
              >
                <span className="text-primary">{suggestion.icon}</span>
                <span className="text-xs">{suggestion.label}</span>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
