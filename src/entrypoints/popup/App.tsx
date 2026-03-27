import { createSignal, onMount, Show, For } from 'solid-js';
import { settingsStore } from '~/stores';
import { ProBadge } from '~/components/ui';
import { UpgradeModal } from '~/components/payment';

/**
 * CodeFrame 主弹窗入口组件
 * 作为截图功能的导航入口
 */
export default function App() {
  const [showUpgradeModal, setShowUpgradeModal] = createSignal(false);
  
  onMount(async () => {
    await settingsStore.loadAll();
  });
  
  const isPro = () => settingsStore.isPro();

  type CaptureType = 'visible' | 'area' | 'fullpage' | 'delayed' | 'desktop' | 'edit';

  const handleCapture = async (type: CaptureType) => {
    console.log('Capture:', type);
  };

  // 主要操作按钮配置
  const mainActions = [
    { type: 'visible' as CaptureType, icon: 'scan', label: '可视区域', gradient: 'from-violet-500 to-purple-500' },
    { type: 'area' as CaptureType, icon: 'crop', label: '选择区域', gradient: 'from-emerald-500 to-green-500' },
    { type: 'fullpage' as CaptureType, icon: 'scroll', label: '整个页面', gradient: 'from-blue-500 to-cyan-500' },
  ];

  // 更多操作配置
  const moreActions = [
    { type: 'delayed' as CaptureType, icon: 'timer', label: '延时截取可视区域', pro: false },
    { type: 'desktop' as CaptureType, icon: 'monitor', label: '桌面窗口', pro: true },
    { type: 'edit' as CaptureType, icon: 'image-plus', label: '编辑本地或粘贴图片', pro: false },
  ];

  // Lucide 图标 SVG
  const Icon = ({ name, class: className = '' }: { name: string; class?: string }) => {
    const icons: Record<string, string> = {
      scan: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>',
      crop: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 2v14a2 2 0 002 2h14M2 6v14a2 2 0 002 2h14"/>',
      scroll: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>',
      timer: '<circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2" stroke-linecap="round"/>',
      monitor: '<rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"/><line x1="8" y1="21" x2="16" y2="21" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke-width="2"/>',
      'image-plus': '<rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      settings: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/>',
      'chevron-right': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>',
    };
    
    return (
      <svg class={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" innerHTML={icons[name] || ''} />
    );
  };

  return (
    <div class="w-[360px] bg-[#0A0F1C] rounded-xl p-4 flex flex-col gap-4 shadow-2xl">
      {/* Header */}
      <header class="flex items-center justify-between h-10 px-3 rounded-lg bg-[#1E293B]">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Icon name="code" class="w-3.5 h-3.5 text-white" />
          </div>
          <span class="font-semibold text-sm text-white">CodeFrame</span>
          <Show when={isPro()}>
            <ProBadge size="sm" />
          </Show>
        </div>
        <button 
          class="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center hover:bg-[#1E293B] transition-colors duration-200 cursor-pointer group"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          <Icon name="settings" class="w-4 h-4 text-[#94A3B8] group-hover:text-white transition-colors" />
        </button>
      </header>

      {/* Main Actions */}
      <div class="flex gap-3 justify-between">
        <For each={mainActions}>
          {(action) => (
            <button
              class="flex-1 flex flex-col items-center gap-2.5 p-4 bg-[#1E293B] rounded-xl hover:bg-[#334155] transition-all duration-200 cursor-pointer group"
              onClick={() => handleCapture(action.type)}
            >
              <div class={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                <Icon name={action.icon} class="w-6 h-6 text-white" />
              </div>
              <span class="text-xs font-medium text-white">{action.label}</span>
            </button>
          )}
        </For>
      </div>

      {/* More Actions */}
      <div class="flex flex-col gap-2">
        <span class="text-[11px] font-semibold text-[#64748B] tracking-wider uppercase px-0.5">更多功能</span>
        
        <div class="flex flex-col gap-1.5">
          <For each={moreActions}>
            {(action) => (
              <button
                class={`w-full h-11 bg-[#1E293B] rounded-lg px-3 flex items-center gap-3 hover:bg-[#334155] transition-colors duration-200 cursor-pointer group ${action.pro && !isPro() ? 'opacity-60' : ''}`}
                onClick={() => action.pro && !isPro() ? setShowUpgradeModal(true) : handleCapture(action.type)}
              >
                <div class="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center group-hover:bg-[#1E293B] transition-colors duration-200">
                  <Icon name={action.icon} class="w-4 h-4 text-[#94A3B8] group-hover:text-[#22D3EE] transition-colors" />
                </div>
                <span class="text-sm font-medium text-white flex-1 text-left">{action.label}</span>
                <Show when={action.pro && !isPro()}>
                  <ProBadge size="sm" />
                </Show>
                <Icon name="chevron-right" class="w-4 h-4 text-[#475569] group-hover:text-[#22D3EE] transition-colors" />
              </button>
            )}
          </For>
        </div>
      </div>
      
      {/* Footer */}
      <div class="flex items-center justify-center gap-4 pt-2 border-t border-[#1E293B]">
        <button class="text-xs text-[#64748B] hover:text-white transition-colors cursor-pointer">
          使用帮助
        </button>
        <span class="text-[#334155]">•</span>
        <button class="text-xs text-[#64748B] hover:text-white transition-colors cursor-pointer">
          功能反馈
        </button>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal()} 
        onClose={() => setShowUpgradeModal(false)} 
      />
    </div>
  );
}
