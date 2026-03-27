import { Show, createSignal } from 'solid-js';
import { Button, Select, ProBadge } from '~/components/ui';
import { settingsStore, codeStore } from '~/stores';

export interface ExportButtonProps {
  type: 'code' | 'screenshot';
  onExport?: (format: string) => Promise<void>;
}

/**
 * ExportPanel 导出面板组件
 */
export function ExportPanel(props: ExportButtonProps) {
  const [isExporting, setIsExporting] = createSignal(false);
  const isPro = () => settingsStore.isPro();
  
  const formatOptions = [
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP', disabled: !isPro() },
    { value: 'svg', label: 'SVG', disabled: !isPro() },
  ];
  
  const scaleOptions = [
    { value: '1', label: '1x' },
    { value: '2', label: '2x' },
    { value: '3', label: '3x', disabled: !isPro() },
    { value: '4', label: '4x', disabled: !isPro() },
  ];
  
  const handleExport = async (format: string) => {
    setIsExporting(true);
    try {
      await props.onExport?.(format);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleCopy = async () => {
    // TODO: 实现复制到剪贴板
    console.log('Copy to clipboard');
  };
  
  return (
    <div class="space-y-4">
      {/* 格式选择 */}
      <div class="flex items-center gap-3">
        <Select
          options={formatOptions}
          value={settingsStore.settings().export.format}
          onChange={(value) => settingsStore.updateExportSettings({ format: value as 'png' | 'webp' | 'svg' })}
          class="flex-1"
        />
        <Select
          options={scaleOptions}
          value={String(settingsStore.settings().export.scale)}
          onChange={(value) => settingsStore.updateExportSettings({ scale: parseInt(value) })}
          class="w-24"
        />
      </div>
      
      {/* 水印提示 */}
      <Show when={!isPro()}>
        <div class="flex items-center gap-2 p-3 rounded-lg bg-bg-tertiary text-sm text-text-secondary">
          <span class="text-warning">⚠️</span>
          <span>免费版导出将添加水印</span>
          <ProBadge />
        </div>
      </Show>
      
      {/* 操作按钮 */}
      <div class="flex gap-2">
        <Button
          variant="primary"
          loading={isExporting()}
          onClick={() => handleExport(settingsStore.settings().export.format)}
          class="flex-1"
        >
          导出 {settingsStore.settings().export.format.toUpperCase()}
        </Button>
        <Button
          variant="secondary"
          onClick={handleCopy}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
