import { Show, createMemo } from 'solid-js';
import { screenshotStore } from '~/stores/screenshotStore';

export interface ScreenshotPreviewProps {
  scale?: number;
}

/**
 * ScreenshotPreview 截图预览组件
 */
export function ScreenshotPreview(props: ScreenshotPreviewProps) {
  const settings = () => screenshotStore.settings();
  
  const containerStyle = createMemo(() => ({
    'background': getBackgroundStyle(settings().background),
    'padding': `${settings().padding}px`,
    'border-radius': `${settings().borderRadius}px`,
    'box-shadow': settings().shadow ? '0 20px 40px rgba(0,0,0,0.4)' : 'none',
    'transform': `scale(${props.scale ?? 1})`,
    'transform-origin': 'center center',
  }));
  
  return (
    <Show
      when={screenshotStore.originalImage()}
      fallback={
        <div class="flex items-center justify-center h-full text-text-tertiary">
          <div class="text-center">
            <span class="text-4xl mb-2 block">🖼️</span>
            <span class="text-sm">暂无图片</span>
          </div>
        </div>
      }
    >
      {(image) => (
        <div class="flex items-center justify-center p-8">
          <div style={containerStyle()}>
            <img
              src={image()}
              alt="Screenshot preview"
              class="max-w-full h-auto rounded-lg"
              style={{
                'border-radius': `${settings().borderRadius / 2}px`,
              }}
            />
          </div>
        </div>
      )}
    </Show>
  );
}

/**
 * 获取背景样式
 */
function getBackgroundStyle(bg: string): string {
  // 渐变
  if (bg.startsWith('gradient-')) {
    const gradients: Record<string, string> = {
      'gradient-1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'gradient-4': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'gradient-5': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'gradient-6': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'gradient-7': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'gradient-8': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    };
    return gradients[bg] ?? gradients['gradient-1'];
  }
  
  // 纯色
  const colors: Record<string, string> = {
    'white': '#ffffff',
    'black': '#0a0a0a',
    'gray': '#1e1e1e',
    'blue': '#3b82f6',
    'purple': '#8b5cf6',
    'green': '#22c55e',
    'orange': '#f97316',
    'pink': '#ec4899',
  };
  
  return colors[bg] ?? '#1e1e1e';
}
