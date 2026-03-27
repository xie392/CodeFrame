import { createSignal, onMount, Show, For } from 'solid-js';
import { codeStore, screenshotStore, settingsStore } from '~/stores';
import { Button, Toggle, Slider, ProBadge, Modal } from '~/components/ui';
import { CodeEditor, CodePreview, ThemeSelector, LanguageSelector, WindowStyleSelector, BackgroundPicker } from '~/components/code';
import { DeviceSelector, ImageSourceSelector, ScreenshotPreview } from '~/components/screenshot';
import { ExportPanel } from '~/components/export';
import { UpgradeModal } from '~/components/payment';

/**
 * CodeFrame 主页面组件
 * 提供代码转图片和截图美化功能
 */
export default function App() {
  const [activeTab, setActiveTab] = createSignal<'code' | 'screenshot'>('code');
  const [showUpgradeModal, setShowUpgradeModal] = createSignal(false);
  const [showExportPanel, setShowExportPanel] = createSignal(false);
  
  onMount(async () => {
    await Promise.all([
      codeStore.loadSettings(),
      screenshotStore.loadSettings(),
      settingsStore.loadAll(),
    ]);
  });
  
  const isPro = () => settingsStore.isPro();

  // Lucide 图标组件
  const Icon = ({ name, class: className = '' }: { name: string; class?: string }) => {
    const icons: Record<string, string> = {
      code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
      settings: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0"/>',
    };
    return <svg class={`fill-none stroke-current ${className}`} viewBox="0 0 24 24" innerHTML={icons[name] || ''} />;
  };

  // Tab 配置
  const tabs = [
    { id: 'code' as const, icon: 'code', label: '代码转图片' },
    { id: 'screenshot' as const, icon: 'image', label: '截图美化' },
  ];

  // 代码转图片模块
  const CodeTab = () => (
    <div class="flex h-full gap-6">
      {/* 左侧：控制面板 */}
      <div class="w-80 flex flex-col gap-4 overflow-y-auto pr-2">
        <CodeEditor />
        
        <div class="flex flex-col gap-3 p-4 rounded-xl bg-[#1E293B]">
          <LanguageSelector />
          <ThemeSelector />
          
          <div class="flex items-center justify-between py-2 border-t border-[#334155]">
            <span class="text-sm text-[#94A3B8]">行号</span>
            <Toggle
              checked={codeStore.settings().showLineNumbers}
              onChange={() => codeStore.toggleLineNumbers()}
            />
          </div>
          
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-[#94A3B8]">字体大小</span>
            <Slider
              value={codeStore.settings().fontSize}
              min={12}
              max={24}
              step={1}
              onChange={(v) => codeStore.updateFontSize(v)}
              showValue
            />
          </div>
        </div>
        
        <BackgroundPicker
          value={codeStore.settings().background}
          onChange={(bg) => codeStore.updateBackground(bg)}
          isPro={isPro()}
        />
        
        <div class="flex gap-3 mt-auto pt-4">
          <Button variant="secondary" size="sm" class="flex-1">
            复制
          </Button>
          <Button variant="primary" size="sm" class="flex-1" onClick={() => setShowExportPanel(true)}>
            导出图片
          </Button>
        </div>
        
        <Show when={!isPro()}>
          <div class="flex items-center justify-center gap-1 text-xs text-[#64748B] py-2">
            <span>免费版有水印</span>
            <button 
              class="text-[#22D3EE] hover:underline cursor-pointer"
              onClick={() => setShowUpgradeModal(true)}
            >
              升级 Pro
            </button>
          </div>
        </Show>
      </div>
      
      {/* 右侧：预览 */}
      <div class="flex-1 flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-white">预览</span>
          <WindowStyleSelector />
        </div>
        
        <div class="flex-1 min-h-0 rounded-2xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#6366F1] to-[#EC4899] p-10 shadow-2xl">
          <Show
            when={codeStore.code()}
            fallback={
              <div class="text-center">
                <div class="text-white/40 text-lg">输入代码后预览</div>
              </div>
            }
          >
            <CodePreview scale={0.6} />
          </Show>
        </div>
      </div>
    </div>
  );

  // 截图美化模块
  const ScreenshotTab = () => (
    <div class="flex h-full gap-6">
      {/* 左侧：设置 */}
      <div class="w-72 flex flex-col gap-4 overflow-y-auto pr-2">
        <ImageSourceSelector />
        
        <Show when={screenshotStore.imageSource() === 'capture'}>
          <Button variant="secondary" size="sm" block onClick={() => screenshotStore.captureCurrentTab()}>
            捕获当前标签页
          </Button>
        </Show>
        
        <Show when={screenshotStore.imageSource() === 'upload'}>
          <label class="block cursor-pointer">
            <input type="file" accept="image/*" class="hidden" onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => screenshotStore.setImage(ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }} />
            <Button variant="secondary" size="sm" block as="span">选择图片</Button>
          </label>
        </Show>
        
        <DeviceSelector isPro={isPro()} />
        
        <BackgroundPicker
          value={screenshotStore.settings().background}
          onChange={(bg) => screenshotStore.updateBackground(bg)}
          isPro={isPro()}
        />
        
        <div class="flex flex-col gap-4 p-4 rounded-xl bg-[#1E293B]">
          <div class="flex flex-col gap-2">
            <span class="text-sm text-[#94A3B8]">圆角</span>
            <Slider
              value={screenshotStore.settings().borderRadius}
              min={0}
              max={32}
              step={2}
              onChange={(v) => screenshotStore.updateBorderRadius(v)}
              showValue
            />
          </div>
          
          <div class="flex items-center justify-between py-2 border-t border-[#334155]">
            <span class="text-sm text-[#94A3B8]">显示阴影</span>
            <Toggle
              checked={screenshotStore.settings().shadow}
              onChange={() => screenshotStore.toggleShadow()}
            />
          </div>
        </div>
        
        <Show when={!isPro()}>
          <div class="mt-auto p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <p class="text-xs text-[#94A3B8] mb-3">
              今日剩余截图次数：{3 - screenshotStore.todayCount()}
            </p>
            <Button variant="ghost" size="sm" block onClick={() => setShowUpgradeModal(true)}>
              升级 Pro 解锁无限次 <ProBadge />
            </Button>
          </div>
        </Show>
      </div>
      
      {/* 右侧：预览 */}
      <div class="flex-1 flex flex-col gap-4 min-w-0">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-white">预览</span>
        </div>
        
        <div class="flex-1 min-h-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#6366F1] to-[#EC4899] p-6 shadow-2xl">
          <ScreenshotPreview />
        </div>
        
        <Button variant="primary" block onClick={() => setShowExportPanel(true)}>
          导出图片
        </Button>
      </div>
    </div>
  );

  return (
    <div class="min-h-screen bg-[#0A0F1C] flex flex-col">
      {/* Header */}
      <header class="flex items-center justify-between px-6 h-14 bg-[#1E293B] shrink-0 border-b border-[#334155]">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Icon name="code" class="w-4 h-4 text-white stroke-[2]" />
          </div>
          <span class="text-lg font-semibold text-white">CodeFrame</span>
          <Show when={isPro()}>
            <span class="px-2 py-0.5 text-[10px] font-bold text-[#0A0F1C] bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded shadow">
              PRO
            </span>
          </Show>
        </div>
        <button 
          class="w-9 h-9 rounded-lg bg-[#0F172A] flex items-center justify-center hover:bg-[#1E293B] transition-colors duration-200 cursor-pointer group"
          onClick={() => {}}
        >
          <Icon name="settings" class="w-[18px] h-[18px] text-[#94A3B8] group-hover:text-white transition-colors stroke-[1.5]" />
        </button>
      </header>

      {/* Tabs */}
      <div class="flex items-center gap-2 px-6 h-12 bg-[#1E293B] shrink-0">
        <For each={tabs}>
          {(tab) => (
            <button
              class={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab() === tab.id 
                  ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-lg' 
                  : 'bg-[#0F172A] text-[#64748B] hover:text-white hover:bg-[#1E293B]'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} class="w-4 h-4" />
              {tab.label}
            </button>
          )}
        </For>
      </div>

      {/* Main Content */}
      <main class="flex-1 p-6 min-h-0 overflow-hidden">
        <Show when={activeTab() === 'code'}>
          <CodeTab />
        </Show>
        <Show when={activeTab() === 'screenshot'}>
          <ScreenshotTab />
        </Show>
      </main>
      
      {/* Modals */}
      <UpgradeModal open={showUpgradeModal()} onClose={() => setShowUpgradeModal(false)} />
      <Modal open={showExportPanel()} onClose={() => setShowExportPanel(false)} title="导出设置">
        <ExportPanel 
          type={activeTab()}
          onExport={async (format) => {
            console.log('Export as:', format);
            setShowExportPanel(false);
          }}
        />
      </Modal>
    </div>
  );
}
