import { createSignal, onMount, Show } from 'solid-js';
import { settingsStore } from '~/stores';
import { ProBadge } from '~/components/ui';
import { UpgradeModal } from '~/components/payment';

/**
 * CodeFrame 主弹窗入口组件
 * 作为截图功能的导航入口
 */
export default function App() {
  const [showUpgradeModal, setShowUpgradeModal] = createSignal(false);
  
  // 加载设置
  onMount(async () => {
    await settingsStore.loadAll();
  });
  
  const isPro = () => settingsStore.isPro();

  // 截图功能类型
  type CaptureType = 'visible' | 'area' | 'fullpage' | 'delayed' | 'desktop' | 'edit';

  // 执行截图操作
  const handleCapture = async (type: CaptureType) => {
    // TODO: 实现各种截图功能
    console.log('Capture:', type);
  };

  return (
    <div class="w-90 bg-[#0A0F1C] rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <header class="h-10 bg-[#1E293B] rounded-lg px-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          {/* Logo Icon */}
          <svg class="w-5 h-5 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          {/* Logo Text */}
          <span class="text-sm font-semibold text-white">CodeFrame</span>
          <Show when={isPro()}>
            <ProBadge size="sm" />
          </Show>
        </div>
        {/* Settings Button */}
        <button 
          class="w-8 h-8 bg-[#0F172A] rounded-md flex items-center justify-center"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <svg class="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main Actions */}
      <div class="flex gap-3 justify-between">
        {/* Capture Visible */}
        <button
          class="flex-1 flex flex-col items-center gap-2.5 p-4 bg-[#1E293B] rounded-xl"
          onClick={() => handleCapture('visible')}
        >
          <svg class="w-6 h-6 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
          </svg>
          <span class="text-xs font-medium text-white">可视区域</span>
        </button>
        
        {/* Select Area */}
        <button
          class="flex-1 flex flex-col items-center gap-2.5 p-4 bg-[#1E293B] rounded-xl"
          onClick={() => handleCapture('area')}
        >
          <svg class="w-6 h-6 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2v14a2 2 0 002 2h14M2 6v14a2 2 0 002 2h14" />
          </svg>
          <span class="text-xs font-medium text-white">选择区域</span>
        </button>
        
        {/* Full Page */}
        <button
          class="flex-1 flex flex-col items-center gap-2.5 p-4 bg-[#1E293B] rounded-xl"
          onClick={() => handleCapture('fullpage')}
        >
          <svg class="w-6 h-6 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span class="text-xs font-medium text-white">整个页面</span>
        </button>
      </div>

      {/* More Actions */}
      <div class="flex flex-col gap-2">
        <span class="text-[11px] font-semibold text-[#64748B] tracking-wider uppercase px-0.5">更多功能</span>
        
        <div class="flex flex-col gap-2">
          {/* Delayed Capture */}
          <button
            class="w-full h-11 bg-[#1E293B] rounded-lg px-3 flex items-center gap-3"
            onClick={() => handleCapture('delayed')}
          >
            <svg class="w-[18px] h-[18px] text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round" />
            </svg>
            <span class="text-[13px] font-medium text-white flex-1 text-left">延时截取可视区域</span>
            <svg class="w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Desktop Window */}
          <button
            class={`w-full h-11 bg-[#1E293B] rounded-lg px-3 flex items-center gap-3 ${!isPro() ? 'opacity-60' : ''}`}
            onClick={() => !isPro() ? setShowUpgradeModal(true) : handleCapture('desktop')}
          >
            <svg class="w-[18px] h-[18px] text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2" />
              <line x1="8" y1="21" x2="16" y2="21" stroke-width="2" stroke-linecap="round" />
              <line x1="12" y1="17" x2="12" y2="21" stroke-width="2" />
            </svg>
            <span class="text-[13px] font-medium text-white flex-1 text-left">桌面窗口</span>
            <Show when={!isPro()}>
              <ProBadge size="sm" />
            </Show>
            <svg class="w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Edit Image */}
          <button
            class="w-full h-11 bg-[#1E293B] rounded-lg px-3 flex items-center gap-3"
            onClick={() => handleCapture('edit')}
          >
            <svg class="w-[18px] h-[18px] text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-[13px] font-medium text-white flex-1 text-left">编辑本地或粘贴图片</span>
            <svg class="w-4 h-4 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal()} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
