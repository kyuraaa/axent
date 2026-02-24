
import React, { useState, useEffect } from 'react';
import { User, Copy, Check } from 'lucide-react';
import { Message } from './types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';

interface ChatMessageProps {
  message: Message;
  isNew?: boolean;
}

const ChatMessage = ({ message, isNew = false }: ChatMessageProps) => {
  const [animationComplete, setAnimationComplete] = useState(!isNew || message.role === 'user');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Mark animation as complete after TextGenerateEffect finishes
  useEffect(() => {
    if (message.role === 'assistant' && isNew) {
      // Estimate animation time based on word count
      const wordCount = message.content.split(' ').length;
      const animationTime = wordCount * 200 + 500; // 200ms per word + buffer
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, animationTime);
      return () => clearTimeout(timer);
    }
  }, [message.content, message.role, isNew]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "Berhasil disalin",
        description: "Pesan AI telah disalin ke clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Gagal menyalin",
        description: "Terjadi kesalahan saat menyalin pesan",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] p-4 rounded-xl ${
          message.role === 'user'
            ? 'bg-budgify-600/30 text-white ml-10'
            : 'bg-white/10 text-white mr-10'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {message.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          )}
          <span className="text-sm font-medium">
            {message.role === 'assistant' ? 'Axent AI' : 'You'}
          </span>
          <span className="text-xs text-white/50 ml-auto">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="space-y-2">
          {message.role === 'assistant' && isNew && !animationComplete ? (
            <TextGenerateEffect 
              words={message.content}
              className="whitespace-pre-wrap"
              duration={0.3}
              filter={false}
            />
          ) : (
            <p className="whitespace-pre-wrap">
              {message.content}
            </p>
          )}
          {message.role === 'assistant' && animationComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs hover:bg-white/10"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-400" />
                  <span className="text-green-400">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1 text-white/60" />
                  <span className="text-white/60">Salin</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
