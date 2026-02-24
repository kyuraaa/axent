
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';
import { Message, FinancialInsight } from './types';

interface ChatInterfaceProps {
  messages: Message[];
  isThinking: boolean;
  insights: FinancialInsight[] | undefined;
  onSendMessage: (message: string) => void;
}

const ChatInterface = ({ messages, isThinking, insights, onSendMessage }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="glass-card p-6 flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isThinking && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 relative">
        <Textarea
          placeholder="Ask for financial advice..."
          className="w-full bg-white/5 border-white/10 focus-visible:ring-budgify-500/50 resize-none"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
        />
        <Button
          className="absolute bottom-3 right-3 h-8 w-8 p-0 bg-budgify-500 hover:bg-budgify-600"
          onClick={handleSendMessage}
          disabled={!input.trim() || isThinking}
        >
          <SendHorizontal size={16} />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;
