import { JSX, splitProps } from 'solid-js';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  block?: boolean;
}

/**
 * Button 按钮组件
 */
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'block',
    'class',
    'children',
  ]);
  
  const variantClasses = () => {
    switch (local.variant ?? 'primary') {
      case 'primary':
        return 'bg-accent text-text-inverted hover:bg-accent-hover';
      case 'secondary':
        return 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary';
      case 'ghost':
        return 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary';
      default:
        return 'bg-accent text-text-inverted hover:bg-accent-hover';
    }
  };
  
  const sizeClasses = () => {
    switch (local.size ?? 'md') {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-5 py-2.5 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };
  
  return (
    <button
      class={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses()}
        ${sizeClasses()}
        ${local.block ? 'w-full' : ''}
        ${local.class ?? ''}
      `}
      disabled={local.loading}
      {...rest}
    >
      {local.loading && (
        <svg
          class="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {local.children}
    </button>
  );
}
