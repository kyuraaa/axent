
import React from 'react';

const ThinkingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] p-4 rounded-xl bg-white/10 text-white mr-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Axent AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-budgify-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-budgify-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2.5 h-2.5 rounded-full bg-budgify-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
