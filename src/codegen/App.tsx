import React from 'react';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-[#FAFAFA] font-mono flex">
      <aside className="w-72 bg-[#0A0A0A] border-r border-[#2a2a2a] p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#10B981] text-lg font-bold">&gt;</span>
          <span className="text-sm">code_input</span>
        </div>
        
        <div className="bg-[#0F0F0F] p-3 flex-1">
          <p className="text-[#4B5563] text-sm">// paste your code here...</p>
        </div>
        
        <div className="bg-[#0F0F0F] h-9 flex items-center px-3 gap-2">
          <span className="text-xs text-[#6B7280]">language:</span>
          <span className="text-xs">javascript</span>
        </div>
        
        <p className="text-xs text-[#6B7280]">// theme</p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-10 bg-[#1E1E1E]" />
          ))}
        </div>
        
        <p className="text-xs text-[#6B7280]">// background</p>
        <div className="flex gap-2">
          {['#6366F1', '#8B5CF6', '#EC4899', '#0EA5E9'].map((color) => (
            <div key={color} className="w-10 h-10" style={{ backgroundColor: color }} />
          ))}
        </div>
        
        <button className="h-10 bg-[#10B981] text-[#0A0A0A] text-sm font-medium">
          $ export_image
        </button>
      </aside>
      
      <main className="flex-1 bg-[#6366F1] flex items-center justify-center">
        <div className="bg-[#1E1E1E] w-[400px]">
          <div className="h-9 bg-[#252526] flex items-center px-3 gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            <span className="text-xs text-[#6B7280] ml-2">main.js</span>
          </div>
          <div className="p-4">
            <p className="text-sm text-[#4B5563]">// code preview</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
