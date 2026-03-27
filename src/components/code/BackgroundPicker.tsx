import { For } from 'solid-js';
import backgrounds from '~/assets/backgrounds.json';

export interface BackgroundPickerProps {
  value: string;
  onChange: (bg: string) => void;
  isPro?: boolean;
}

/**
 * BackgroundPicker 背景选择器组件
 */
export function BackgroundPicker(props: BackgroundPickerProps) {
  const { solidColors, gradients } = backgrounds;
  
  return (
    <div class="space-y-3">
      <label class="text-sm text-text-secondary">背景</label>
      
      {/* 纯色 */}
      <div class="space-y-2">
        <span class="text-xs text-text-tertiary">纯色</span>
        <div class="flex flex-wrap gap-2">
          <For each={solidColors}>
            {(color) => (
              <button
                class={`
                  relative w-8 h-8 rounded-lg border-2 transition-all
                  ${props.value === color.id ? 'border-accent' : 'border-transparent'}
                  ${color.isPro && !props.isPro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                `}
                style={{ background: color.value }}
                onClick={() => !color.isPro || props.isPro ? props.onChange(color.id) : undefined}
                title={color.name}
              >
                {color.isPro && !props.isPro && (
                  <span class="absolute -top-1 -right-1 text-[8px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1 rounded">
                    PRO
                  </span>
                )}
              </button>
            )}
          </For>
        </div>
      </div>
      
      {/* 渐变 */}
      <div class="space-y-2">
        <span class="text-xs text-text-tertiary">渐变</span>
        <div class="flex flex-wrap gap-2">
          <For each={gradients}>
            {(gradient) => (
              <button
                class={`
                  relative w-8 h-8 rounded-lg border-2 transition-all
                  ${props.value === gradient.id ? 'border-accent' : 'border-transparent'}
                  ${gradient.isPro && !props.isPro ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                `}
                style={{ background: gradient.value }}
                onClick={() => !gradient.isPro || props.isPro ? props.onChange(gradient.id) : undefined}
                title={gradient.name}
              >
                {gradient.isPro && !props.isPro && (
                  <span class="absolute -top-1 -right-1 text-[8px] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1 rounded">
                    PRO
                  </span>
                )}
              </button>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
