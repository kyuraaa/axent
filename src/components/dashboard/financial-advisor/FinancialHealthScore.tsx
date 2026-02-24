
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const FinancialHealthScore = () => {
  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Health Score</h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/70">Overall</span>
            <span className="text-sm font-medium">76/100</span>
          </div>
          <Progress value={76} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/70">Savings</span>
            <span className="text-sm font-medium">Good</span>
          </div>
          <Progress value={80} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/70">Debt Management</span>
            <span className="text-sm font-medium">Fair</span>
          </div>
          <Progress value={65} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/70">Retirement</span>
            <span className="text-sm font-medium">Good</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/70">Risk Management</span>
            <span className="text-sm font-medium">Needs Work</span>
          </div>
          <Progress value={58} className="h-2" />
        </div>
      </div>
    </Card>
  );
};

export default FinancialHealthScore;
