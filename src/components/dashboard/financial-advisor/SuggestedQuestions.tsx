
import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

const SuggestedQuestions = ({ questions, onSelectQuestion }: SuggestedQuestionsProps) => {
  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-budgify-500/20 flex items-center justify-center">
          <Sparkles size={18} className="text-budgify-400" />
        </div>
        <h3 className="text-lg font-semibold">Suggested Questions</h3>
      </div>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={index}
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
            onClick={() => onSelectQuestion(question)}
          >
            <span className="text-sm">{question}</span>
            <ChevronRight size={16} className="text-white/50" />
          </button>
        ))}
      </div>
    </Card>
  );
};

export default SuggestedQuestions;
