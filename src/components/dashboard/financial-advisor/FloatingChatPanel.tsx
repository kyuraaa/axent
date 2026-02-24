import React, { useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';
import { Message } from './types';
import { Textarea } from '@/components/ui/textarea';
import ConversationList from './ConversationList';

interface SuggestedQuestion {
  icon: React.ComponentType<any>;
  text: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface FloatingChatPanelProps {
  messages: Message[];
  isThinking: boolean;
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  onRegenerateResponse: () => void;
  onDownloadAdvice: () => void;
  isSavingAdvice: boolean;
  isOpen: boolean;
  onToggle: () => void;
  suggestedQuestions: SuggestedQuestion[];
  newMessageIds: Set<string>;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

const FloatingChatPanel = ({
  messages,
  isThinking,
  onSendMessage,
  onStopGeneration,
  onRegenerateResponse,
  onDownloadAdvice,
  isSavingAdvice,
  isOpen,
  onToggle,
  suggestedQuestions,
  newMessageIds,
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: FloatingChatPanelProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  React.useEffect(() => {
    if (isOpen && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    onSendMessage(question);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in">
      <div className="h-full w-full flex">
        {/* Conversation List Sidebar */}
        <div className="w-72 hidden md:flex flex-col border-r border-border bg-card/50">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onNewConversation={onNewConversation}
            onDeleteConversation={onDeleteConversation}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="default"
                size="default"
                onClick={onToggle}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 shadow-lg shadow-primary/20"
              >
                <ArrowLeft className="h-5 w-5" />
                Kembali ke Dashboard
              </Button>
              <div className="h-6 w-px bg-border hidden md:block" />
              <div className="hidden md:block">
                <h3 className="font-semibold text-lg text-primary">Axent AI</h3>
                <p className="text-xs text-muted-foreground">Konsultan keuangan pribadi</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onDownloadAdvice}
              disabled={isSavingAdvice}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  isNew={newMessageIds.has(message.id)}
                />
              ))}
              {isThinking && (
                <>
                  <ThinkingIndicator />
                  <div className="flex justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onStopGeneration}
                      className="text-xs"
                    >
                      Hentikan Respon
                    </Button>
                  </div>
                </>
              )}
              {!isThinking && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="flex justify-start gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerateResponse}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          <div className="px-4 py-2 border-t border-border bg-card/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-4xl mx-auto">
              {suggestedQuestions.map((question, index) => {
                const Icon = question.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(question.text)}
                    className="flex items-center gap-2 p-2 text-xs text-left rounded-lg border border-border/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
                    disabled={isThinking}
                  >
                    <Icon className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{question.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/30">
            <div className="relative max-w-4xl mx-auto">
              <Textarea
                placeholder="Tanyakan tentang keuangan Anda..."
                className="w-full bg-background border-border focus-visible:ring-primary/50 resize-none pr-12"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
              />
              <Button
                className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-primary hover:bg-primary/90"
                onClick={handleSendMessage}
                disabled={!input.trim() || isThinking}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingChatPanel;
