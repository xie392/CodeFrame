import { JSX, createSignal, splitProps, For, Show } from 'solid-js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  class?: string;
}

/**
 * Select 下拉选择组件
 */
export function Select(props: SelectProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  
  const selectedOption = () => 
    props.options.find((opt) => opt.value === props.value);
  
  const handleSelect = (value: string) => {
    props.onChange?.(value);
    setIsOpen(false);
  };
  
  return (
    <div class={`relative ${props.class ?? ''}`}>
      <button
        type="button"
        class={`
          w-full px-3 py-2
          flex items-center justify-between gap-2
          rounded-lg bg-bg-tertiary
          text-sm text-text-primary
          border border-transparent
          hover:bg-bg-secondary
          focus:outline-none focus:border-accent
          transition-colors
          ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !props.disabled && setIsOpen(!isOpen())}
        disabled={props.disabled}
      >
        <span class="flex items-center gap-2 truncate">
          <Show when={selectedOption()?.icon}>
            <span>{selectedOption()?.icon}</span>
          </Show>
          <span class={props.value ? 'text-text-primary' : 'text-text-tertiary'}>
            {selectedOption()?.label ?? props.placeholder ?? '请选择'}
          </span>
        </span>
        <svg
          class={`w-4 h-4 text-text-tertiary transition-transform ${isOpen() ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <Show when={isOpen()}>
        <div class="absolute z-50 w-full mt-1 py-1 bg-bg-secondary rounded-lg shadow-lg border border-border-primary max-h-60 overflow-auto">
          <For each={props.options}>
            {(option) => (
              <button
                type="button"
                class={`
                  w-full px-3 py-2
                  flex items-center gap-2
                  text-sm text-left
                  hover:bg-bg-tertiary
                  transition-colors
                  ${option.value === props.value ? 'text-accent bg-bg-tertiary' : 'text-text-primary'}
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
              >
                <Show when={option.icon}>
                  <span>{option.icon}</span>
                </Show>
                <span>{option.label}</span>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
