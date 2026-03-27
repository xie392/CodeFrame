import { splitProps } from 'solid-js';

export interface SliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  class?: string;
}

/**
 * Slider 滑块组件
 */
export function Slider(props: SliderProps) {
  const [local] = splitProps(props, [
    'value',
    'min',
    'max',
    'step',
    'onChange',
    'disabled',
    'showValue',
    'class',
  ]);
  
  const min = () => local.min ?? 0;
  const max = () => local.max ?? 100;
  const step = () => local.step ?? 1;
  const value = () => local.value ?? min();
  
  const percentage = () => {
    return ((value() - min()) / (max() - min())) * 100;
  };
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    local.onChange?.(parseFloat(target.value));
  };
  
  return (
    <div class={`flex items-center gap-3 ${local.class ?? ''}`}>
      <div class="relative flex-1 h-1.5 bg-bg-tertiary rounded-full">
        {/* Progress */}
        <div
          class="absolute h-full bg-accent rounded-full"
          style={{ width: `${percentage()}%` }}
        />
        
        {/* Input */}
        <input
          type="range"
          min={min()}
          max={max()}
          step={step()}
          value={value()}
          class={`
            absolute inset-0 w-full h-full
            appearance-none bg-transparent
            cursor-pointer
            ${local.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onChange={handleChange}
          onInput={handleChange}
          disabled={local.disabled}
        />
        
        {/* Custom Thumb */}
        <div
          class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${percentage()}% - 8px)` }}
        />
      </div>
      
      {local.showValue && (
        <span class="text-sm text-text-secondary min-w-[40px] text-right">
          {value()}
        </span>
      )}
    </div>
  );
}
