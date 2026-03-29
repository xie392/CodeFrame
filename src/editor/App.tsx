import React, { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@shared/constants';

interface CaptureResultData {
  success: boolean;
  imageData?: string;
  error?: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.CAPTURE_RESULT, (result) => {
      const data = result[STORAGE_KEYS.CAPTURE_RESULT] as CaptureResultData | undefined;
      if (data?.success && data.imageData) {
        setImageData(data.imageData);
      } else if (data?.error) {
        setError(data.error);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-screen h-screen bg-[#0A0A0A] text-[#FAFAFA] font-mono flex">
      {/* 工具栏 */}
      <aside className="w-12 bg-[#0A0A0A] border-r border-[#2a2a2a] flex flex-col items-center py-2 gap-1">
        <div className="w-8 h-8 flex items-center justify-center text-[#10B981]">[v]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[-&gt;]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[ ]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[o]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[t]</div>
        <div className="w-8 h-8 flex items-center justify-center text-[#6B7280]">[#]</div>
      </aside>

      {/* 画布区域 */}
      <main className="flex-1 bg-[#1A1A1A] flex items-center justify-center overflow-auto p-4">
        {loading ? (
          <p className="text-[#4B5563]">// loading...</p>
        ) : imageData ? (
          <img
            src={imageData}
            alt="截图结果"
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        ) : error ? (
          <div className="text-center">
            <p className="text-[#EF4444] text-sm mb-2">// capture error</p>
            <p className="text-[#6B7280] text-xs">{error}</p>
          </div>
        ) : (
          <p className="text-[#4B5563]">// editor canvas</p>
        )}
      </main>

      {/* 属性面板 */}
      <aside className="w-48 bg-[#0A0A0A] border-l border-[#2a2a2a] p-4">
        <p className="text-xs text-[#6B7280]">// properties</p>
      </aside>
    </div>
  );
};

export default App;
