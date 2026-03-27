import { JSX, Show, createEffect, onCleanup } from 'solid-js';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Modal 弹窗组件
 */
export function Modal(props: ModalProps) {
  // 处理 ESC 关闭
  createEffect(() => {
    if (props.open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          props.onClose();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      });
    }
  });
  
  const sizeClasses = () => {
    switch (props.size ?? 'md') {
      case 'sm':
        return 'w-80';
      case 'md':
        return 'w-96';
      case 'lg':
        return 'w-[500px]';
      default:
        return 'w-96';
    }
  };
  
  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={props.onClose}
        />
        
        {/* Modal Content */}
        <div
          class={`
            relative ${sizeClasses()}
            bg-bg-secondary rounded-xl shadow-xl
            animate-scale-in
          `}
        >
          {/* Header */}
          <Show when={props.title}>
            <div class="flex items-center justify-between px-5 py-4 border-b border-border-primary">
              <h3 class="text-base font-semibold text-text-primary">{props.title}</h3>
              <button
                class="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                onClick={props.onClose}
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Show>
          
          {/* Body */}
          <div class="p-5">
            {props.children}
          </div>
        </div>
      </div>
    </Show>
  );
}
