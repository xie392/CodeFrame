import { splitProps } from 'solid-js';

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  class?: string;
}

/**
 * Toggle 开关组件
 */
export function Toggle(props: ToggleProps) {
  const [local] = splitProps(props, ['checked', 'onChange', 'disabled', 'size', 'class']);
  
  const sizeConfig = () => {
    switch (local.size ?? 'md') {
      case 'sm':
        return { wrapper: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3' };
      case 'md':
      default:
        return { wrapper: 'w-10 h-6', thumb: 'w-5 h-5', translate: 'translate-x-4' };
    }
  };
  
  return (
    <button
      type="button"
      role="switch"
      aria-checked={local.checked}
      class={`
        relative inline-flex shrink-0
        rounded-full
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary
        ${local.checked ? 'bg-accent' : 'bg-bg-tertiary'}
        ${local.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${sizeConfig().wrapper}
        ${local.class ?? ''}
      `}
      onClick={() => !local.disabled && local.onChange?.(!local.checked)}
      disabled={local.disabled}
    >
      <span
        class={`
          absolute top-0.5 left-0.5
          bg-white rounded-full shadow
          transition-transform duration-200
          ${local.checked ? sizeConfig().translate : 'translate-x-0'}
          ${sizeConfig().thumb}
        `}
      />
    </button>
  );
}
