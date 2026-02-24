
import React, { useState, useEffect } from 'react';
import { MessageSquare, TrendingUp, Wallet, Bitcoin, DollarSign, PieChart, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Message } from './financial-advisor/types';
import { supabase } from '@/integrations/supabase/client';
import FloatingChatPanel from './financial-advisor/FloatingChatPanel';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';

interface SuggestedQuestion {
  icon: React.ComponentType<any>;
  text: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface FinancialAdvisorProps {
  onChatbotToggle?: (isOpen: boolean) => void;
}

// Generate smart title based on message content
const generateSmartTitle = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Define keywords and their corresponding titles
  const titlePatterns: { keywords: string[]; title: string }[] = [
    { keywords: ['pemasukan', 'gaji', 'income', 'pendapatan', 'bonus'], title: '💰 Pencatatan Pemasukan' },
    { keywords: ['pengeluaran', 'belanja', 'expense', 'beli', 'bayar'], title: '💸 Pencatatan Pengeluaran' },
    { keywords: ['investasi', 'invest', 'saham', 'stock', 'reksadana'], title: '📈 Diskusi Investasi' },
    { keywords: ['crypto', 'bitcoin', 'btc', 'eth', 'koin'], title: '🪙 Diskusi Crypto' },
    { keywords: ['budget', 'anggaran', 'budgeting'], title: '📊 Perencanaan Budget' },
    { keywords: ['tabung', 'saving', 'menabung', 'simpan'], title: '🐷 Tips Menabung' },
    { keywords: ['hutang', 'debt', 'cicilan', 'kredit', 'pinjam'], title: '💳 Manajemen Hutang' },
    { keywords: ['portfolio', 'portofolio', 'aset'], title: '📁 Analisis Portfolio' },
    { keywords: ['tips', 'saran', 'advice', 'rekomendasi'], title: '💡 Saran Keuangan' },
    { keywords: ['analisis', 'analysis', 'analisa', 'review'], title: '🔍 Analisis Keuangan' },
    { keywords: ['target', 'goal', 'tujuan', 'rencana'], title: '🎯 Perencanaan Finansial' },
    { keywords: ['bisnis', 'business', 'usaha', 'dagang'], title: '🏢 Keuangan Bisnis' },
  ];

  // Find matching pattern
  for (const pattern of titlePatterns) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return pattern.title;
    }
  }

  // Default: Use truncated message with chat emoji
  const truncated = message.slice(0, 35).trim();
  return `💬 ${truncated}${message.length > 35 ? '...' : ''}`;
};

const FinancialAdvisor = ({ onChatbotToggle }: FinancialAdvisorProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSavingAdvice, setSavingAdvice] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Notify parent when chatbot opens/closes
  useEffect(() => {
    onChatbotToggle?.(isPanelOpen);
  }, [isPanelOpen, onChatbotToggle]);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setConversations(data);
          // Load the most recent conversation
          setCurrentConversationId(data[0].id);
        } else {
          // Create first conversation
          const { data: newConv, error: createError } = await supabase
            .from('conversations')
            .insert({
              user_id: userId,
              title: 'Chat Baru',
            })
            .select()
            .single();

          if (createError) throw createError;
          if (newConv) {
            setConversations([newConv]);
            setCurrentConversationId(newConv.id);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Gagal memuat riwayat chat",
          variant: "destructive",
        });
      }
    };

    loadConversations();
  }, [userId, toast]);

  // Load messages for current conversation
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!userId || !currentConversationId) return;
      
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
        } else {
          // Add initial greeting if no history
          const greeting: Message = {
            id: '1',
            role: 'assistant',
            content: "Halo! Saya Axent AI, asisten keuangan pribadi Anda. Saya dapat membantu Anda dengan saran budgeting, strategi investasi, perencanaan pensiun, manajemen utang, dan masih banyak lagi. Apa yang ingin Anda diskusikan hari ini?",
            timestamp: new Date(),
          };
          setMessages([greeting]);
          
          // Save greeting to database
          await supabase.from('chat_messages').insert({
            user_id: userId,
            conversation_id: currentConversationId,
            role: 'assistant',
            content: greeting.content,
          });

          // Update conversation title based on first user message
          await supabase
            .from('conversations')
            .update({ title: 'Chat Baru' })
            .eq('id', currentConversationId);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast({
          title: "Error",
          description: "Gagal memuat riwayat chat",
          variant: "destructive",
        });
      }
    };

    const generateDynamicQuestions = async () => {
      if (!userId) return;

      const questions: SuggestedQuestion[] = [];

      try {
        // Check budget transactions
        const { data: budgetData } = await supabase
          .from('budget_transactions')
          .select('*')
          .eq('user_id', userId)
          .limit(1);

        if (budgetData && budgetData.length > 0) {
          questions.push(
            { icon: TrendingUp, text: "Berapa total pengeluaran saya bulan ini?" },
            { icon: PieChart, text: "Kategori apa yang paling banyak saya belanjakan?" }
          );
        }

        // Check investments
        const { data: investmentData } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', userId)
          .limit(1);

        if (investmentData && investmentData.length > 0) {
          questions.push(
            { icon: Wallet, text: "Bagaimana performa portofolio investasi saya?" },
            { icon: Target, text: "Apa saran diversifikasi untuk investasi saya?" }
          );
        }

        // Check crypto holdings
        const { data: cryptoData } = await supabase
          .from('crypto_holdings')
          .select('*')
          .eq('user_id', userId)
          .limit(1);

        if (cryptoData && cryptoData.length > 0) {
          questions.push(
            { icon: Bitcoin, text: "Bagaimana analisis portfolio crypto saya?" },
            { icon: DollarSign, text: "Kapan waktu yang tepat untuk take profit crypto?" }
          );
        }

        // Default questions if no data
        if (questions.length === 0) {
          questions.push(
            { icon: MessageSquare, text: "Bagaimana cara memulai budgeting yang efektif?" },
            { icon: TrendingUp, text: "Apa tips investasi untuk pemula?" }
          );
        }

        // Limit to 2 questions for UI space
        setSuggestedQuestions(questions.slice(0, 2));

      } catch (error) {
        console.error('Error generating dynamic questions:', error);
        // Set default questions on error
        setSuggestedQuestions([
          { icon: MessageSquare, text: "Bagaimana cara memulai budgeting yang efektif?" },
          { icon: TrendingUp, text: "Apa tips investasi untuk pemula?" }
        ]);
      }
    };

    loadChatHistory();
    generateDynamicQuestions();
  }, [userId, currentConversationId, toast]);

  const handleSendMessage = async (input: string, isRegenerate = false) => {
    if (!userId || !currentConversationId) {
      toast({
        title: "Error",
        description: "Anda harus login terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    let updatedMessages = [...messages];
    
    if (!isRegenerate) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Save user message to database
      await supabase.from('chat_messages').insert({
        user_id: userId,
        conversation_id: currentConversationId,
        role: 'user',
        content: input,
      });

      // Update conversation title with first user message - generate smart title
      if (messages.length <= 1) {
        const smartTitle = generateSmartTitle(input);
        await supabase
          .from('conversations')
          .update({ title: smartTitle, updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
        
        // Refresh conversations list
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });
        if (data) setConversations(data);
      }
    } else {
      // Remove last AI response for regeneration
      updatedMessages = messages.slice(0, -1);
      setMessages(updatedMessages);
      
      // Delete last AI response from database
      const lastAiMessage = messages[messages.length - 1];
      if (lastAiMessage.role === 'assistant') {
        await supabase.from('chat_messages').delete().eq('id', lastAiMessage.id);
      }
    }
    
    setIsThinking(true);

    // Create abort controller for stop functionality
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // First, try to execute as a command (for transactions, investments, etc.)
      const { data: commandData, error: commandError } = await supabase.functions.invoke('ai-command-executor', {
        body: { message: input }
      });

      if (controller.signal.aborted) {
        throw new Error('Request stopped by user');
      }

      let aiResponse = '';
      
      // Check if command was executed successfully
      if (!commandError && commandData?.executed) {
        // Command was executed - use the response from command executor
        aiResponse = commandData.response + '\n\n✅ Data telah otomatis tercatat di database Anda dengan tanggal hari ini (' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + '). Silakan cek halaman terkait untuk melihat catatan.';
        
        toast({
          title: "Berhasil Dicatat",
          description: commandData.response,
        });
      } else {
        // Not a command or command failed - use financial advisor for discussion
        const { data, error } = await supabase.functions.invoke('financial-advisor-chat', {
          body: { 
            userId: userId,
            messages: updatedMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }
        });

        if (error) throw error;
        aiResponse = data?.response || 'Maaf, tidak dapat memproses permintaan Anda saat ini.';
      }

      // Add AI response
      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages([...updatedMessages, assistantMessage]);
      
      // Mark this as a new message for typewriter animation
      setNewMessageIds(prev => new Set(prev).add(assistantId));

      // Save AI response to database
      await supabase.from('chat_messages').insert({
        user_id: userId,
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiResponse,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversationId);

    } catch (error: any) {
      if (error.message !== 'Request stopped by user') {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Gagal mengirim pesan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsThinking(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsThinking(false);
      toast({
        title: "Dihentikan",
        description: "Respon AI telah dihentikan",
      });
    }
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = messages[messages.length - 2];
    if (lastUserMessage.role === 'user') {
      await handleSendMessage(lastUserMessage.content, true);
    }
  };

  const handleDownloadAdvice = () => {
    setSavingAdvice(true);
    
    try {
      const adviceText = messages
        .map(msg => `${msg.role === 'user' ? 'You' : 'Axent AI'}: ${msg.content}`)
        .join('\n\n');
      
      const blob = new Blob([adviceText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axent-ai-advice-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Saran keuangan berhasil diunduh",
      });
    } catch (error) {
      console.error('Error downloading advice:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh saran keuangan",
        variant: "destructive",
      });
    } finally {
      setSavingAdvice(false);
    }
  };

  const handleNewConversation = async () => {
    if (!userId) return;

    try {
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: 'Chat Baru',
        })
        .select()
        .single();

      if (error) throw error;
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        setMessages([]);
      }

      toast({
        title: "Success",
        description: "Chat baru telah dibuat",
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Gagal membuat chat baru",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If deleted current conversation, select another or create new
      if (conversationId === currentConversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          setCurrentConversationId(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }

      toast({
        title: "Success",
        description: "Chat berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus chat",
        variant: "destructive",
      });
    }
  };

  const handleWelcomeSendMessage = async (message: string) => {
    if (!userId) return;

    try {
      // Generate smart title based on message content
      const smartTitle = generateSmartTitle(message);
      
      // Always create a brand new conversation with smart title
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: smartTitle,
        })
        .select()
        .single();

      if (error) throw error;

      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setCurrentConversationId(newConv.id);
        setMessages([]);
        setIsPanelOpen(true);
        setIsPanelOpen(true);
        
        // Wait for state to update then send message
        setTimeout(() => {
          handleSendMessageWithConversation(message, newConv.id);
        }, 100);
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
      toast({
        title: "Error",
        description: "Gagal membuat chat baru",
        variant: "destructive",
      });
    }
  };

  const handleSendMessageWithConversation = async (input: string, conversationId: string) => {
    if (!userId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages([userMessage]);
    setIsThinking(true);

    // Save user message to database
    await supabase.from('chat_messages').insert({
      user_id: userId,
      conversation_id: conversationId,
      role: 'user',
      content: input,
    });

    // Create abort controller
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // First, try to execute as a command (for transactions, investments, etc.)
      const { data: commandData, error: commandError } = await supabase.functions.invoke('ai-command-executor', {
        body: { message: input }
      });

      if (controller.signal.aborted) {
        throw new Error('Request stopped by user');
      }

      let aiResponse = '';
      
      // Check if command was executed successfully
      if (!commandError && commandData?.executed) {
        // Command was executed - use the response from command executor
        aiResponse = commandData.response + '\n\n✅ Data telah otomatis tercatat di database Anda dengan tanggal hari ini. Silakan cek halaman terkait untuk melihat catatan.';
        
        toast({
          title: "Berhasil Dicatat",
          description: commandData.response,
        });
      } else {
        // Not a command or command failed - use financial advisor for discussion
        const { data, error } = await supabase.functions.invoke('financial-advisor-chat', {
          body: { 
            userId: userId,
            messages: [{ role: 'user', content: input }]
          }
        });

        if (error) throw error;
        aiResponse = data?.response || 'Maaf, tidak dapat memproses permintaan Anda saat ini.';
      }

      const assistantId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages([userMessage, assistantMessage]);
      setNewMessageIds(prev => new Set(prev).add(assistantId));

      // Save AI response
      await supabase.from('chat_messages').insert({
        user_id: userId,
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse,
      });

    } catch (error: any) {
      if (error.message !== 'Request stopped by user') {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Gagal mengirim pesan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsThinking(false);
      setAbortController(null);
    }
  };

  return (
    <>
      {/* Welcome Page - shows when panel is closed */}
      {!isPanelOpen && (
        <div className="min-h-[calc(100vh-4rem)] rounded-xl flex items-center justify-center bg-background">
          <AnimatedAIChat
            onSendMessage={handleWelcomeSendMessage}
            isProcessing={isThinking}
            title="Axent AI"
            subtitle="Asisten keuangan pribadi Anda — ketik perintah atau tanyakan apa saja"
            placeholder="Tanyakan sesuatu kepada Axent AI..."
            showBackground={false}
          />
        </div>
      )}

      {/* Floating Chat Panel */}
      <FloatingChatPanel
        messages={messages}
        isThinking={isThinking}
        onSendMessage={(input) => handleSendMessage(input, false)}
        onStopGeneration={handleStopGeneration}
        onRegenerateResponse={handleRegenerateResponse}
        onDownloadAdvice={handleDownloadAdvice}
        isSavingAdvice={isSavingAdvice}
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(!isPanelOpen)}
        suggestedQuestions={suggestedQuestions}
        newMessageIds={newMessageIds}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
    </>
  );
};

export default FinancialAdvisor;
