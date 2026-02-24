
import React from 'react';
import { Check } from 'lucide-react';

const ActionItems = () => {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-semibold mb-4">Your Action Items</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center mt-0.5">
            <Check size={14} className="text-green-500" />
          </div>
          <div>
            <h4 className="font-medium">Create an emergency fund</h4>
            <p className="text-sm text-white/70">Start with $1,000, then build up to 3-6 months of expenses</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
            <Check size={14} className="text-white/50" />
          </div>
          <div>
            <h4 className="font-medium">Increase retirement contributions</h4>
            <p className="text-sm text-white/70">Aim to invest at least 15% of your income for retirement</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
            <Check size={14} className="text-white/50" />
          </div>
          <div>
            <h4 className="font-medium">Pay off high-interest debt</h4>
            <p className="text-sm text-white/70">Focus on credit cards and personal loans first</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center mt-0.5">
            <Check size={14} className="text-white/50" />
          </div>
          <div>
            <h4 className="font-medium">Review insurance coverage</h4>
            <p className="text-sm text-white/70">Ensure you have adequate health, life, and property insurance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionItems;
