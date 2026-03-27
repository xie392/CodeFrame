import { Show } from 'solid-js';

export interface ProBadgeProps {
  show?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Pro 徽章组件
 */
export function ProBadge(props: ProBadgeProps) {
  return (
    <Show when={props.show ?? true}>
      <span
        class={`
          inline-flex items-center
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-semibold
          rounded-md
          ${props.size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}
        `}
      >
        PRO
      </span>
    </Show>
  );
}
