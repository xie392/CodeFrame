/**
 * useCurrent Hook
 * 用于在事件处理器中访问最新状态值，替代 useEffect 同步 Ref 的反模式
 */

import { useRef } from 'react';

/**
 * 返回一个 ref，其 current 值始终为最新的传入值
 * 在渲染期间同步更新，避免额外的 useEffect 执行
 *
 * @example
 * ```tsx
 * const scaleRef = useCurrent(scale);
 * // 在事件处理器中使用 scaleRef.current 获取最新值
 * ```
 */
export function useCurrent<T>(value: T): { current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
