import React from 'react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationListProps) => {
  return (
    <div className="w-full h-full flex flex-col border-r bg-background/50">
      {/* Header */}
      <div className="p-4 border-b">
        <Button
          onClick={onNewConversation}
          className="w-full bg-budgify-500 hover:bg-budgify-600 gap-2"
        >
          <Plus className="h-4 w-4" />
          Chat Baru
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                currentConversationId === conversation.id
                  ? 'bg-budgify-500/10 border border-budgify-500/50'
                  : 'hover:bg-muted border border-transparent'
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <MessageSquare className="h-4 w-4 text-budgify-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.updated_at), {
                    addSuffix: true,
                    locale: id,
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
