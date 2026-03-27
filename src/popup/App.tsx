import React from 'react';

const App: React.FC = () => {
  return (
    <div className="w-[360px] h-[500px] bg-[#0A0A0A] text-[#FAFAFA] font-mono">
      <header className="flex items-center justify-between h-12 px-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className="text-[#10B981] text-xl font-bold">&gt;</span>
          <span className="text-sm">codeframe</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
          <span>[dark]</span>
          <span>[set]</span>
        </div>
      </header>
      
      <main className="p-4">
        <p className="text-sm text-[#6B7280]">// popup content</p>
      </main>
    </div>
  );
};

export default App;
