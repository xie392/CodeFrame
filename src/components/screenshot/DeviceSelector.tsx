import { createMemo, Show, For } from 'solid-js';
import { screenshotStore, DEVICES } from '~/stores/screenshotStore';
import { ProBadge } from '~/components/ui';
import devices from '~/assets/devices.json';

export interface DeviceSelectorProps {
  isPro?: boolean;
}

/**
 * DeviceSelector 设备选择器组件
 */
export function DeviceSelector(props: DeviceSelectorProps) {
  const selectedDevice = createMemo(() => {
    return DEVICES.find((d) => d.id === screenshotStore.settings().device);
  });
  
  return (
    <div class="space-y-3">
      <label class="text-sm text-text-secondary">设备边框</label>
      <div class="grid grid-cols-3 gap-2">
        <For each={DEVICES}>
          {(device) => (
            <button
              class={`
                relative p-3 rounded-lg border-2 transition-all
                flex flex-col items-center gap-2
                ${screenshotStore.settings().device === device.id 
                  ? 'border-accent bg-accent/10' 
                  : 'border-border-primary hover:border-text-tertiary'}
                ${device.isPro && !props.isPro ? 'opacity-50' : ''}
              `}
              onClick={() => {
                if (!device.isPro || props.isPro) {
                  screenshotStore.updateDevice(device.id);
                }
              }}
              disabled={device.isPro && !props.isPro}
            >
              <span class="text-2xl">
                {device.type === 'laptop' && '💻'}
                {device.type === 'phone' && '📱'}
                {device.type === 'tablet' && '📟'}
                {device.type === 'browser' && '🌐'}
                {device.type === 'desktop' && '🖥️'}
              </span>
              <span class="text-xs text-text-primary truncate w-full text-center">
                {device.name}
              </span>
              {device.isPro && <ProBadge show={!props.isPro} size="sm" />}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

/**
 * ImageSourceSelector 图片来源选择器
 */
export function ImageSourceSelector() {
  return (
    <div class="space-y-3">
      <label class="text-sm text-text-secondary">图片来源</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          class={`
            p-3 rounded-lg border-2 transition-all
            flex flex-col items-center gap-2
            ${screenshotStore.imageSource() === 'capture' 
              ? 'border-accent bg-accent/10' 
              : 'border-border-primary hover:border-text-tertiary'}
          `}
          onClick={() => screenshotStore.switchImageSource('capture')}
        >
          <span class="text-2xl">📷</span>
          <span class="text-xs text-text-primary">捕获标签页</span>
        </button>
        <button
          class={`
            p-3 rounded-lg border-2 transition-all
            flex flex-col items-center gap-2
            ${screenshotStore.imageSource() === 'upload' 
              ? 'border-accent bg-accent/10' 
              : 'border-border-primary hover:border-text-tertiary'}
          `}
          onClick={() => screenshotStore.switchImageSource('upload')}
        >
          <span class="text-2xl">📁</span>
          <span class="text-xs text-text-primary">上传图片</span>
        </button>
      </div>
    </div>
  );
}
