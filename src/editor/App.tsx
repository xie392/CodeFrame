import React from 'react';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-[#FAFAFA] font-mono flex">
      <aside className="w-12 bg-[#0A0A0A] border-r border-[#2a2a2a] flex flex-col items-center py-2 gap-1">
        <div className="w-8 h-8 flex items-center justify-center text-[#10B981]">[v]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[-&gt;]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[ ]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[o]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[t]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[#]</div>
      </aside>
      
      <main className="flex-1 bg-[#1A1A1A] flex items-center justify-center">
        <p className="text-[#4B5563]">// editor canvas</p>
      </main>
      
      <aside className="w-48 bg-[#0A0A0A] border-l border-[#2a2a2a] p-4">
        <p className="text-xs text-[#6B7280]">// properties</p>
      </aside>
    </div>
  );
};

export default App;
